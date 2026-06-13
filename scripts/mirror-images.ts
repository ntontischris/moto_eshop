/**
 * Evacuate product images off the dying legacy origin into Supabase Storage
 * (ADR 0005). For every product whose `images_cdn` is still NULL, download each
 * legacy image, re-encode it to a single WebP, upload it to the public
 * `product-images` bucket at a deterministic `sha1(url).webp` path, and record
 * the resulting public URLs in `products.images_cdn`.
 *
 * Idempotent: the deterministic path lets re-runs skip already-uploaded images,
 * and only products still NULL are visited — so a re-run fills the gaps. A
 * product's `images_cdn` is written only when ALL of its images upload cleanly;
 * a partial failure leaves it NULL so the next run retries the whole product.
 *
 * Run (creds from .env.local — NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY):
 *   pnpm tsx scripts/mirror-images.ts --dry-run        # show the plan, write nothing
 *   pnpm tsx scripts/mirror-images.ts --limit 20       # mirror first 20 products
 *   pnpm tsx scripts/mirror-images.ts                  # full evacuation
 */

import { config } from "dotenv";
config({ path: ".env.local" });
config({ path: ".env" });

import { createClient } from "@supabase/supabase-js";
import {
  encodeWebp,
  storagePathFor,
  sourceUrls,
  mapWithConcurrency,
} from "../src/lib/images/mirror";

const BUCKET = "product-images";
const PRODUCT_CONCURRENCY = 6;
const PAGE_SIZE = 500;
const LEGACY_UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
  "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

const dryRun = process.argv.includes("--dry-run");
const limitIdx = process.argv.indexOf("--limit");
const limit =
  limitIdx >= 0 ? Number.parseInt(process.argv[limitIdx + 1] ?? "", 10) : null;

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!supabaseUrl || !serviceKey) {
  console.error(
    "Missing NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY in .env.local",
  );
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

interface PendingProduct {
  id: string;
  urls: string[];
}

/** All products still needing mirroring (images present, images_cdn NULL). */
async function fetchPending(max: number | null): Promise<PendingProduct[]> {
  const pending: PendingProduct[] = [];
  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await supabase
      .from("products")
      .select("id, images, images_cdn")
      .is("images_cdn", null)
      .not("images", "is", null)
      .range(from, from + PAGE_SIZE - 1);
    if (error) throw new Error(`fetchPending: ${error.message}`);
    if (!data || data.length === 0) break;

    for (const row of data) {
      const urls = sourceUrls(row.images);
      if (urls.length > 0) pending.push({ id: row.id, urls });
      if (max !== null && pending.length >= max) return pending.slice(0, max);
    }
    if (data.length < PAGE_SIZE) break;
  }
  return pending;
}

/** Mirror one source URL; returns its public CDN URL. Throws on failure. */
async function mirrorOne(sourceUrl: string): Promise<string> {
  const path = storagePathFor(sourceUrl);

  const res = await fetch(sourceUrl, {
    headers: { "User-Agent": LEGACY_UA, Accept: "image/*" },
  });
  if (!res.ok) throw new Error(`download ${res.status} ${sourceUrl}`);
  const original = Buffer.from(await res.arrayBuffer());
  const webp = await encodeWebp(original);

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, webp, { contentType: "image/webp", upsert: false });
  // An already-existing object is a clean idempotent skip, not a failure.
  if (error && !/exists/i.test(error.message)) {
    throw new Error(`upload ${sourceUrl}: ${error.message}`);
  }

  return supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
}

interface Report {
  products: number;
  mirrored: number;
  imagesUploaded: number;
  failed: { id: string; url: string; reason: string }[];
}

async function main(): Promise<void> {
  console.log(
    `[mirror] ${dryRun ? "DRY RUN — " : ""}fetching products with images_cdn = NULL…`,
  );
  const pending = await fetchPending(limit);
  const totalImages = pending.reduce((n, p) => n + p.urls.length, 0);
  console.log(
    `[mirror] ${pending.length} products / ${totalImages} images to evacuate` +
      (limit !== null ? ` (--limit ${limit})` : ""),
  );

  if (dryRun) {
    console.log("[mirror] dry run — nothing downloaded or written.");
    return;
  }

  const report: Report = {
    products: pending.length,
    mirrored: 0,
    imagesUploaded: 0,
    failed: [],
  };

  await mapWithConcurrency(pending, PRODUCT_CONCURRENCY, async (product) => {
    const cdnUrls: string[] = [];
    for (const url of product.urls) {
      try {
        cdnUrls.push(await mirrorOne(url));
        report.imagesUploaded++;
      } catch (err) {
        report.failed.push({
          id: product.id,
          url,
          reason: err instanceof Error ? err.message : String(err),
        });
        return; // leave images_cdn NULL so a re-run retries this product
      }
    }

    const { error } = await supabase
      .from("products")
      .update({ images_cdn: cdnUrls })
      .eq("id", product.id);
    if (error) {
      report.failed.push({
        id: product.id,
        url: "(db update)",
        reason: error.message,
      });
      return;
    }
    report.mirrored++;
    if (report.mirrored % 50 === 0) {
      console.log(`[mirror] …${report.mirrored}/${pending.length} products`);
    }
  });

  console.log("\n──────── mirror report ────────");
  console.log(`✓ products mirrored : ${report.mirrored}/${report.products}`);
  console.log(`✓ images uploaded   : ${report.imagesUploaded}`);
  console.log(`✗ failures          : ${report.failed.length}`);
  for (const f of report.failed.slice(0, 50)) {
    console.log(`   ✗ ${f.id}  ${f.url}  — ${f.reason}`);
  }
  if (report.failed.length > 50) {
    console.log(`   …and ${report.failed.length - 50} more`);
  }
  console.log("───────────────────────────────");

  if (report.failed.length > 0) process.exitCode = 1;
}

main().catch((err) => {
  console.error("[mirror] fatal:", err);
  process.exit(1);
});
