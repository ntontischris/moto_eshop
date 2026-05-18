/**
 * Mirror legacy motomarket-shop.gr product images into our own Supabase
 * Storage (bucket: product-images), as WebP@1600px, then write the new
 * public URLs to products.images_cdn. The storefront prefers images_cdn
 * and falls back to the legacy proxy for not-yet-migrated rows, so this
 * is safe to run incrementally and is fully resumable.
 *
 * DELIBERATELY GENTLE on the legacy origin (it is the client's live shop):
 * low concurrency + a delay between every request. Popular products first
 * so a partial run already covers the highest-traffic pages.
 *
 * Prereq (run once in Supabase SQL editor if the script tells you to):
 *   alter table products add column if not exists images_cdn jsonb;
 *
 * Run (download happens from wherever YOU run this — needs network to
 * motomarket-shop.gr; this dev sandbox cannot reach it):
 *   pnpm tsx scripts/backfill-product-images.ts --dry-run
 *   pnpm tsx scripts/backfill-product-images.ts --limit 200
 *   pnpm tsx scripts/backfill-product-images.ts            # whole catalog
 *
 * Flags:
 *   --dry-run         no fetch/upload/write, just plan
 *   --limit N         only process N products this run (default: all)
 *   --concurrency N   parallel image downloads (default 2, max 4)
 *   --delay MS        pause between images (default 400)
 */

import { config } from "dotenv";
config({ path: ".env.local" });
config({ path: ".env" });

import { createClient } from "@supabase/supabase-js";
import { createHash } from "crypto";
import { existsSync, writeFileSync, mkdirSync } from "fs";
import pLimit from "p-limit";
import sharp from "sharp";

const SUPA_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(SUPA_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const BUCKET = "product-images";
const LEGACY_HOSTS = ["www.motomarket-shop.gr", "motomarket-shop.gr"];
const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
  "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

const args = process.argv.slice(2);
const flag = (n: string, d: number) => {
  const i = args.indexOf(n);
  return i >= 0 && args[i + 1] ? Number(args[i + 1]) : d;
};
const dryRun = args.includes("--dry-run");
const LIMIT = flag("--limit", Infinity);
const CONCURRENCY = Math.min(4, Math.max(1, flag("--concurrency", 2)));
const DELAY = flag("--delay", 400);
const FAIL_LOG = "data/backfill-failures.json";

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
      await sleep(800 * attempt);
    }
  }
  throw lastErr;
}

async function ensureBucket() {
  const { data } = await supabase.storage.getBucket(BUCKET);
  if (!data) {
    await supabase.storage.createBucket(BUCKET, {
      public: true,
      fileSizeLimit: "10MB",
    });
    console.log(`created public bucket "${BUCKET}"`);
  }
}

async function columnExists(): Promise<boolean> {
  const { error } = await supabase
    .from("products")
    .select("images_cdn")
    .limit(1);
  return !error;
}

const failures: { id: string; slug: string; reason: string }[] = [];

async function processProduct(p: {
  id: string;
  slug: string;
  name: string;
  images: unknown;
}): Promise<"done" | "skip" | "fail"> {
  const legacy = rawImages(p.images).filter((i) => isLegacy(i.url));
  if (legacy.length === 0) return "skip"; // nothing to mirror (already cdn/none)

  const limit = pLimit(CONCURRENCY);
  const out: Img[] = [];
  let failed = false;

  await Promise.all(
    legacy.map((img) =>
      limit(async () => {
        if (failed) return;
        try {
          const buf = await fetchImage(img.url);
          const webp = await sharp(buf)
            .resize({ width: 1600, withoutEnlargement: true })
            .webp({ quality: 78 })
            .toBuffer();
          const key = `${p.id}/${img.position}-${sha(img.url)}.webp`;
          if (!dryRun) {
            const { error } = await supabase.storage
              .from(BUCKET)
              .upload(key, webp, {
                contentType: "image/webp",
                upsert: true,
                cacheControl: "31536000",
              });
            if (error) throw error;
          }
          const { data } = supabase.storage.from(BUCKET).getPublicUrl(key);
          out.push({
            url: data.publicUrl,
            alt: img.alt || p.name,
            position: img.position,
          });
          await sleep(DELAY); // be gentle to the legacy origin
        } catch (e) {
          failed = true;
          failures.push({
            id: p.id,
            slug: p.slug,
            reason: `${img.url} :: ${(e as Error).message}`,
          });
        }
      }),
    ),
  );

  if (failed || out.length === 0) return "fail";
  if (dryRun) return "done";

  const { error } = await supabase
    .from("products")
    .update({ images_cdn: out.sort((a, b) => a.position - b.position) })
    .eq("id", p.id);
  return error ? "fail" : "done";
}

async function main() {
  if (!SUPA_URL || !SERVICE_KEY) {
    console.error(
      "Missing NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY",
    );
    process.exit(1);
  }
  if (!(await columnExists())) {
    console.error(
      "\nColumn products.images_cdn is missing. Run this once in the " +
        "Supabase SQL editor, then re-run:\n\n" +
        "  alter table products add column if not exists images_cdn jsonb;\n",
    );
    process.exit(1);
  }
  await ensureBucket();

  console.log(
    `backfill: ${dryRun ? "DRY-RUN " : ""}limit=${LIMIT} ` +
      `concurrency=${CONCURRENCY} delay=${DELAY}ms (popular-first)`,
  );

  const PAGE = 200;
  let from = 0;
  let processed = 0;
  let done = 0;
  let skip = 0;
  let fail = 0;

  while (processed < LIMIT) {
    const { data, error } = await supabase
      .from("products")
      .select("id, slug, name, images, view_count")
      .eq("status", "active")
      .is("images_cdn", null)
      .not("images", "is", null)
      .order("view_count", { ascending: false })
      .range(from, from + PAGE - 1);

    if (error) {
      console.error("query error:", error.message);
      break;
    }
    if (!data || data.length === 0) break;

    for (const p of data) {
      if (processed >= LIMIT) break;
      processed++;
      const r = await processProduct(
        p as { id: string; slug: string; name: string; images: unknown },
      );
      if (r === "done") done++;
      else if (r === "skip") skip++;
      else fail++;
      if (processed % 25 === 0) {
        console.log(
          `  ${processed} processed | ${done} mirrored | ${skip} skipped | ${fail} failed`,
        );
      }
    }
    from += PAGE;
  }

  if (failures.length) {
    if (!existsSync("data")) mkdirSync("data");
    writeFileSync(FAIL_LOG, JSON.stringify(failures, null, 2));
  }
  console.log(
    `\nDONE. processed=${processed} mirrored=${done} skipped=${skip} ` +
      `failed=${fail}${failures.length ? ` (see ${FAIL_LOG})` : ""}`,
  );
  console.log(
    "Re-run the same command to continue (already-mirrored rows are skipped).",
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
