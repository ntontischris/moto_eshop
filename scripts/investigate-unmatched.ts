/**
 * Re-fetch a random sample of "unmatched" URLs from the scraper and explain
 * why they didn't match: missing SKU on page, SKU exists in DB but page
 * not updated, SKU truly absent from ERP catalog, etc.
 *
 * Run: pnpm tsx scripts/investigate-unmatched.ts [--sample 30]
 */

import { config } from "dotenv";
config({ path: ".env.local" });
config({ path: ".env" });

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

const PROGRESS = JSON.parse(readFileSync("data/scrape-progress.json", "utf8"));
const sampleIdx = process.argv.indexOf("--sample");
const SAMPLE_SIZE =
  sampleIdx >= 0 ? Number(process.argv[sampleIdx + 1] ?? "30") : 30;

// shuffle and take sample of done URLs (we can't filter by match status from
// progress alone — match was decided at runtime — so we'll re-classify here)
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const sample: string[] = shuffle(PROGRESS.done).slice(0, SAMPLE_SIZE);

interface PageAnalysis {
  url: string;
  status: number | null;
  h1: string | null;
  /** every uppercase-alphanumeric token that looks like a SKU */
  skuCandidates: string[];
  /** the candidate my scraper would pick (first match of regex) */
  primarySku: string | null;
  /** does primarySku exist in products table? */
  primaryInDb: boolean;
  /** which sample candidates EXIST in DB even if primary didn't match? */
  candidatesInDb: string[];
  /** size of body (sanity check for blocks) */
  bytes: number;
}

async function fetchAndAnalyze(url: string): Promise<PageAnalysis> {
  const out: PageAnalysis = {
    url,
    status: null,
    h1: null,
    skuCandidates: [],
    primarySku: null,
    primaryInDb: false,
    candidatesInDb: [],
    bytes: 0,
  };
  try {
    const r = await fetch(url, {
      headers: { "User-Agent": "MotomarketMigration/1.0" },
    });
    out.status = r.status;
    if (!r.ok) return out;
    const html = await r.text();
    out.bytes = html.length;
    const h1 = html.match(/<h1[^>]*>([^<]+)/);
    out.h1 = h1 ? h1[1].trim().slice(0, 80) : null;

    // Original scraper SKU regex
    const primary = html.match(/\b([A-Z]{2,5}\d{3}[A-Z]{2,5}\d{1,3})\b/);
    out.primarySku = primary ? primary[1] : null;

    // Broader candidates: any A-Z+digits token of length >= 7
    const all = new Set<string>();
    for (const m of html.matchAll(/\b([A-Z]{2,}\d+[A-Z\d]*)\b/g)) {
      if (m[1].length >= 7 && m[1].length <= 24) all.add(m[1]);
    }
    out.skuCandidates = Array.from(all).slice(0, 8);
  } catch {
    // swallow; result keeps defaults
  }
  return out;
}

async function checkInDb(skus: string[]): Promise<Set<string>> {
  if (skus.length === 0) return new Set();
  const { data, error } = await supabase
    .from("products")
    .select("sku")
    .in("sku", skus);
  if (error) {
    console.error("DB lookup error:", error.message);
    return new Set();
  }
  return new Set((data ?? []).map((r) => r.sku));
}

async function main(): Promise<void> {
  console.log(`Analyzing ${SAMPLE_SIZE} random URLs from scraper output...\n`);
  const analyses: PageAnalysis[] = [];
  // light concurrency
  let idx = 0;
  const workers = Array.from({ length: 5 }, async () => {
    while (idx < sample.length) {
      const i = idx++;
      const a = await fetchAndAnalyze(sample[i]);
      // resolve DB membership
      const dbSet = await checkInDb([
        ...(a.primarySku ? [a.primarySku] : []),
        ...a.skuCandidates,
      ]);
      a.primaryInDb = a.primarySku ? dbSet.has(a.primarySku) : false;
      a.candidatesInDb = a.skuCandidates.filter((s) => dbSet.has(s));
      analyses.push(a);
    }
  });
  await Promise.all(workers);

  // ────────────────────────────────────────────────────────
  // Buckets
  // ────────────────────────────────────────────────────────
  const buckets = {
    matched_primary: 0,
    matched_via_secondary: 0,
    no_sku_on_page: 0,
    sku_not_in_db: 0,
    page_404: 0,
    page_error: 0,
  };
  const examples: Record<string, PageAnalysis[]> = {};

  for (const a of analyses) {
    let key: keyof typeof buckets;
    if (a.status === 404) key = "page_404";
    else if (a.status === null || (a.status >= 400 && a.status !== 404))
      key = "page_error";
    else if (a.primaryInDb) key = "matched_primary";
    else if (a.candidatesInDb.length > 0) key = "matched_via_secondary";
    else if (!a.primarySku && a.skuCandidates.length === 0)
      key = "no_sku_on_page";
    else key = "sku_not_in_db";

    buckets[key]++;
    if (!examples[key]) examples[key] = [];
    if (examples[key].length < 3) examples[key].push(a);
  }

  console.log("=== Bucket distribution ===\n");
  const total = analyses.length;
  for (const [k, v] of Object.entries(buckets)) {
    const pct = ((v / total) * 100).toFixed(1);
    console.log(
      `  ${k.padEnd(28)} ${v.toString().padStart(4)} / ${total}  (${pct}%)`,
    );
  }

  console.log("\n=== Sample evidence ===");
  for (const [k, items] of Object.entries(examples)) {
    console.log(`\n[${k}]`);
    for (const a of items) {
      console.log(`  url:   ${a.url}`);
      console.log(`  h1:    ${a.h1 ?? "(none)"}`);
      console.log(`  status:${a.status}  bytes:${a.bytes}`);
      console.log(
        `  primary SKU:   ${a.primarySku ?? "(none)"}  in DB: ${a.primaryInDb}`,
      );
      if (a.skuCandidates.length > 0)
        console.log(`  candidates:    [${a.skuCandidates.join(", ")}]`);
      if (a.candidatesInDb.length > 0)
        console.log(`  ✓ candidates in DB: [${a.candidatesInDb.join(", ")}]`);
    }
  }

  console.log("\n=== Interpretation ===");
  const pctMatched =
    ((buckets.matched_primary + buckets.matched_via_secondary) / total) * 100;
  console.log(`  Real match rate (incl. secondary): ${pctMatched.toFixed(1)}%`);
  if (buckets.matched_via_secondary > 0) {
    console.log(
      `  ⚠ ${buckets.matched_via_secondary} pages have a usable SKU that the primary regex missed`,
    );
  }
  if (buckets.sku_not_in_db > 0) {
    console.log(
      `  ⚠ ${buckets.sku_not_in_db} pages have a SKU on page but it's not in our products table (truly discontinued or never imported)`,
    );
  }
  if (buckets.no_sku_on_page > 0) {
    console.log(
      `  ⚠ ${buckets.no_sku_on_page} pages have no SKU-like token at all (likely landing/category pages mis-included in sitemap)`,
    );
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
