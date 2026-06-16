/**
 * Product-image evacuation (ADR 0005, issue #76).
 *
 * Copies product images off the dying legacy origin (motomarket-shop.gr) into
 * the Supabase `product-images` bucket and records the public URLs in
 * `products.images_cdn`. One-time, re-runnable, idempotent: the storage key is
 * `sha1(sourceUrl)` (see `storagePathFor`), so a re-run skips objects already
 * uploaded and only fills gaps. `images_cdn` is written ONLY when every image
 * for a product mirrored successfully — never optimistically — so a failed
 * product stays NULL and is retried next run.
 *
 * Run:
 *   pnpm tsx scripts/mirror-images.ts --dry-run --limit 5   # no writes, peek
 *   pnpm tsx scripts/mirror-images.ts --limit 50            # small batch first
 *   pnpm tsx scripts/mirror-images.ts                       # full evacuation
 *   pnpm tsx scripts/mirror-images.ts --concurrency 3       # gentler fan-out
 *
 * --limit N caps the number of products (rows) processed this run.
 * Credentials (owner-confirmed interim Supabase) come from .env.local:
 *   NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY
 */

import { config } from "dotenv";
config({ path: ".env.local" });
config({ path: ".env" });

import { createClient } from "@supabase/supabase-js";
import { encodeWebp, storagePathFor } from "../src/lib/images/mirror";
import {
  formatReport,
  legacyImageUrls,
  mapWithConcurrency,
  parseMirrorArgs,
  type MirrorFailure,
  type MirrorReport,
} from "../src/lib/images/mirror-run";

const BUCKET = "product-images";

/** Browser UA the legacy origin accepts (it 403s the Next optimizer's UA). */
const DOWNLOAD_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
    "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  Accept: "image/avif,image/webp,image/png,image/jpeg,*/*;q=0.8",
};

const args = parseMirrorArgs(process.argv.slice(2));

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } },
);

const publicUrlFor = (path: string) =>
  supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;

const isDuplicate = (message: string) =>
  /already exists|duplicate/i.test(message);

/** Result of mirroring one source URL: its public URL, plus whether we uploaded. */
type ImageOutcome =
  | { ok: true; url: string; uploaded: boolean }
  | { ok: false; failure: MirrorFailure };

async function mirrorOne(source: string): Promise<ImageOutcome> {
  const path = storagePathFor(source);

  if (args.dryRun) {
    return { ok: true, url: publicUrlFor(path), uploaded: true };
  }

  let webp: Buffer;
  try {
    const res = await fetch(source, { headers: DOWNLOAD_HEADERS });
    if (!res.ok) {
      return {
        ok: false,
        failure: { source, reason: `upstream ${res.status}` },
      };
    }
    webp = await encodeWebp(Buffer.from(await res.arrayBuffer()));
  } catch (err) {
    return {
      ok: false,
      failure: { source, reason: `download/encode: ${String(err)}` },
    };
  }

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, webp, { contentType: "image/webp", upsert: false });

  if (error && !isDuplicate(error.message)) {
    return {
      ok: false,
      failure: { source, reason: `upload: ${error.message}` },
    };
  }
  // No error → uploaded fresh. Duplicate error → object already there (skip).
  return { ok: true, url: publicUrlFor(path), uploaded: !error };
}

interface ProductRow {
  id: string;
  images: unknown;
}

async function main() {
  let query = supabase
    .from("products")
    .select("id, images")
    .is("images_cdn", null)
    .not("images", "is", null)
    .order("id", { ascending: true });
  if (args.limit) query = query.limit(args.limit);

  const { data, error } = await query;
  if (error) throw new Error(`product query failed: ${error.message}`);
  const products = (data ?? []) as ProductRow[];

  const report: MirrorReport = {
    products: products.length,
    productsOk: 0,
    productsFailed: 0,
    imagesUploaded: 0,
    imagesSkipped: 0,
    failures: [],
  };

  console.log(
    `${args.dryRun ? "[dry-run] " : ""}mirroring ${products.length} products ` +
      `(concurrency ${args.concurrency})…`,
  );

  await mapWithConcurrency(products, args.concurrency, async (product) => {
    const sources = legacyImageUrls(product.images);
    if (sources.length === 0) {
      report.productsOk++;
      return;
    }

    const cdnUrls: string[] = [];
    const failures: MirrorFailure[] = [];
    for (const source of sources) {
      const outcome = await mirrorOne(source);
      if (outcome.ok) {
        cdnUrls.push(outcome.url);
        if (outcome.uploaded) report.imagesUploaded++;
        else report.imagesSkipped++;
      } else {
        failures.push(outcome.failure);
      }
    }

    if (failures.length > 0) {
      report.productsFailed++;
      report.failures.push(...failures);
      return; // images_cdn stays NULL → retried next run
    }

    if (!args.dryRun) {
      const { error: writeError } = await supabase
        .from("products")
        .update({ images_cdn: cdnUrls })
        .eq("id", product.id);
      if (writeError) {
        report.productsFailed++;
        report.failures.push({
          source: product.id,
          reason: `db update: ${writeError.message}`,
        });
        return;
      }
    }
    report.productsOk++;
  });

  console.log("\n" + formatReport(report));
  if (args.dryRun)
    console.log("\n[dry-run] no objects uploaded, no rows written.");
  process.exit(report.productsFailed > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
