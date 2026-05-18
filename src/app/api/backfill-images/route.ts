/**
 * Autonomous image-mirror endpoint. Runs ON Vercel (which CAN reach the
 * legacy origin). One GENTLE batch per call; a Vercel cron drains it over
 * time. Idempotent + resumable (only rows where images_cdn IS NULL,
 * popular-first). Safe no-op until the products.images_cdn column exists.
 *
 * Auth: Vercel cron requests (header x-vercel-cron) OR a manual call with
 *   Authorization: Bearer <SUPABASE_SERVICE_ROLE_KEY>  (no new secret).
 */

import { createHash } from "crypto";
import sharp from "sharp";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Json } from "@/types/database";

// Node runtime is the App-Router default for route handlers (needed for
// sharp). runtime/maxDuration segment configs are rejected under
// cacheComponents — maxDuration is set in vercel.json instead. Small
// batch + idempotent resume keeps each run well within the timeout.

const BUCKET = "product-images";
const LEGACY_HOSTS = ["www.motomarket-shop.gr", "motomarket-shop.gr"];
const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
  "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

const BATCH = 15; // products per invocation — gentle, well within timeout
const DELAY = 250; // ms between images — gentle to the legacy origin

interface Img {
  url: string;
  alt: string;
  position: number;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const sha = (s: string) =>
  createHash("sha1").update(s).digest("hex").slice(0, 12);
const isLegacy = (u: string) => {
  try {
    return LEGACY_HOSTS.includes(new URL(u).hostname);
  } catch {
    return false;
  }
};

function rawImages(images: unknown): Img[] {
  const arr = (images as unknown[]) ?? [];
  return arr
    .map((img, idx): Img => {
      if (typeof img === "string") return { url: img, alt: "", position: idx };
      const o = img as Partial<Img>;
      return {
        url: o.url ?? "",
        alt: o.alt ?? "",
        position: o.position ?? idx,
      };
    })
    .filter((i) => i.url);
}

async function fetchImage(url: string): Promise<Buffer> {
  let lastErr: unknown;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort(), 15000);
      const res = await fetch(url, {
        headers: { "User-Agent": UA, Accept: "image/*" },
        signal: ctrl.signal,
      });
      clearTimeout(t);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return Buffer.from(await res.arrayBuffer());
    } catch (e) {
      lastErr = e;
      await sleep(700 * attempt);
    }
  }
  throw lastErr;
}

function authorized(req: Request): boolean {
  // Vercel cron invocations (no new secret needed)
  if (req.headers.get("x-vercel-cron")) return true;
  if ((req.headers.get("user-agent") ?? "").includes("vercel-cron")) {
    return true;
  }
  // Manual trigger with the already-configured service-role key
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  return !!key && req.headers.get("authorization") === `Bearer ${key}`;
}

export async function GET(req: Request): Promise<Response> {
  if (!authorized(req)) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();

  // Safe no-op until the column exists (run the migration SQL once).
  const probe = await supabase.from("products").select("images_cdn").limit(1);
  if (probe.error) {
    return Response.json({
      skipped: "products.images_cdn column missing — run the migration SQL",
    });
  }

  // ensure bucket
  const { data: bucket } = await supabase.storage.getBucket(BUCKET);
  if (!bucket) {
    await supabase.storage.createBucket(BUCKET, {
      public: true,
      fileSizeLimit: "10MB",
    });
  }

  const { data, error } = await supabase
    .from("products")
    .select("id, slug, name, images")
    .eq("status", "active")
    .is("images_cdn", null)
    .not("images", "is", null)
    .order("view_count", { ascending: false })
    .limit(BATCH);

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
  if (!data || data.length === 0) {
    return Response.json({ done: true, message: "nothing left to mirror" });
  }

  let mirrored = 0;
  let skipped = 0;
  let failed = 0;

  for (const p of data) {
    const legacy = rawImages(p.images).filter((i) => isLegacy(i.url));
    if (legacy.length === 0) {
      skipped++;
      continue;
    }
    const out: Img[] = [];
    let bad = false;

    // Sequential (gentlest possible on the legacy origin — one request
    // at a time with a pause). Per-product image count is small.
    for (const img of legacy) {
      try {
        const buf = await fetchImage(img.url);
        const webp = await sharp(buf)
          .resize({ width: 1600, withoutEnlargement: true })
          .webp({ quality: 78 })
          .toBuffer();
        const key = `${p.id}/${img.position}-${sha(img.url)}.webp`;
        const up = await supabase.storage.from(BUCKET).upload(key, webp, {
          contentType: "image/webp",
          upsert: true,
          cacheControl: "31536000",
        });
        if (up.error) throw up.error;
        const { data: pub } = supabase.storage.from(BUCKET).getPublicUrl(key);
        out.push({
          url: pub.publicUrl,
          alt: img.alt || p.name,
          position: img.position,
        });
        await sleep(DELAY);
      } catch {
        bad = true;
        break;
      }
    }

    if (bad || out.length === 0) {
      failed++;
      continue;
    }
    const upd = await supabase
      .from("products")
      .update({
        images_cdn: out.sort(
          (a, b) => a.position - b.position,
        ) as unknown as Json,
      })
      .eq("id", p.id);
    if (upd.error) failed++;
    else mirrored++;
  }

  return Response.json({
    batch: data.length,
    mirrored,
    skipped,
    failed,
    note: "cron will pick up the next batch automatically",
  });
}
