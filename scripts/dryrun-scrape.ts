/**
 * Stage 1: deterministic dry-run.
 *
 *   For each Greek product URL in the legacy sitemap, extract content using
 *   ONLY canonical signals:
 *     - SKU       → "Model" field inside the Specifications tab
 *     - eshop_id  → the numeric segment in the URL path
 *     - title     → <h1>
 *     - desc      → tab_item tab_1 (Περιγραφή)
 *     - images    → /assets/site/public/n2/... paths
 *
 *   Then validate:
 *     - SKU must exist in our products table (else skip)
 *     - SKU must appear in at most one source URL (else mark conflict)
 *
 *   Writes data/dryrun-report.json with:
 *     - per-SKU resolution
 *     - bucket counts (valid / model_missing / sku_unknown / conflict / error)
 *
 *   DOES NOT touch the database. Apply step is in scripts/apply-scrape.ts.
 */

import { config } from "dotenv";
config({ path: ".env.local" });
config({ path: ".env" });

import { createClient } from "@supabase/supabase-js";
import { createGunzip } from "zlib";
import { Readable } from "stream";
import { writeFileSync, mkdirSync } from "fs";
import { dirname, join } from "path";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const SITEMAP_URL = "https://www.motomarket-shop.gr/sitemap-products.xml.gz";
const ESHOP_ORIGIN = "https://www.motomarket-shop.gr";
const USER_AGENT = "MotomarketMigration/1.0 (dev@motomarket.gr)";
const CONCURRENCY = 8;
const REQUEST_TIMEOUT_MS = 25_000;
const RETRIES = 3;
const REPORT_FILE = "data/dryrun-report.json";
const LIMIT = process.argv.includes("--limit")
  ? Number(process.argv[process.argv.indexOf("--limit") + 1] ?? "0")
  : 0;

// ────────────────────────────────────────────────────────────────────────
// Types
// ────────────────────────────────────────────────────────────────────────
interface ScrapeResult {
  url: string;
  bucket:
    | "valid"
    | "model_missing"
    | "sku_unknown"
    | "model_pattern_invalid"
    | "fetch_404"
    | "fetch_error";
  eshopId: number | null;
  sku: string | null;
  name: string | null;
  description: string | null;
  images: string[];
  error?: string;
}

interface Report {
  generatedAt: string;
  totalUrls: number;
  buckets: Record<string, number>;
  conflicts: Array<{ sku: string; urls: string[] }>;
  results: ScrapeResult[];
  skuToUrl: Record<string, string>; // resolved 1:1 mapping for the apply step
}

// ────────────────────────────────────────────────────────────────────────
// Fetch sitemap
// ────────────────────────────────────────────────────────────────────────
async function fetchSitemap(): Promise<string[]> {
  console.log("→ fetching products sitemap…");
  const resp = await fetch(SITEMAP_URL, {
    headers: { "User-Agent": USER_AGENT },
  });
  if (!resp.ok) throw new Error(`sitemap HTTP ${resp.status}`);
  const buf = Buffer.from(await resp.arrayBuffer());
  const xml: string = await new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    Readable.from(buf)
      .pipe(createGunzip())
      .on("data", (c) => chunks.push(c))
      .on("end", () => resolve(Buffer.concat(chunks).toString("utf8")))
      .on("error", reject);
  });
  const urls = Array.from(xml.matchAll(/<loc>([^<]+)<\/loc>/g)).map(
    (m) => m[1],
  );
  const gr = urls.filter((u) => !u.includes("/en/"));
  console.log(`  ${gr.length} Greek URLs`);
  return gr;
}

// ────────────────────────────────────────────────────────────────────────
// Load known SKUs from DB (for validation only)
// ────────────────────────────────────────────────────────────────────────
async function loadSkuSet(): Promise<Set<string>> {
  console.log("→ loading SKU set from DB…");
  const set = new Set<string>();
  let from = 0;
  const PAGE = 1000;
  while (true) {
    const { data, error } = await supabase
      .from("products")
      .select("sku")
      .range(from, from + PAGE - 1);
    if (error) throw error;
    if (!data || data.length === 0) break;
    for (const r of data) if (r.sku) set.add(r.sku);
    if (data.length < PAGE) break;
    from += PAGE;
  }
  console.log(`  ${set.size} SKUs in DB`);
  return set;
}

// ────────────────────────────────────────────────────────────────────────
// HTTP fetch with retry
// ────────────────────────────────────────────────────────────────────────
async function fetchHtmlWithRetry(url: string): Promise<string> {
  for (let attempt = 1; attempt <= RETRIES; attempt++) {
    try {
      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort(), REQUEST_TIMEOUT_MS);
      const resp = await fetch(url, {
        headers: {
          "User-Agent": USER_AGENT,
          Accept: "text/html",
          "Accept-Language": "el-GR,el;q=0.9",
        },
        signal: ctrl.signal,
      });
      clearTimeout(t);
      if (resp.status === 404) throw new Error("404");
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      return await resp.text();
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      if (msg === "404") throw e;
      if (attempt === RETRIES) throw e;
      await new Promise((r) =>
        setTimeout(r, 500 * 2 ** (attempt - 1) + Math.random() * 200),
      );
    }
  }
  throw new Error("unreachable");
}

// ────────────────────────────────────────────────────────────────────────
// Canonical extraction
// ────────────────────────────────────────────────────────────────────────
const SKU_FORMAT = /^[A-Z][A-Z0-9]{4,17}$/;

function stripTags(s: string): string {
  return s
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
}

interface Extracted {
  eshopId: number | null;
  sku: string | null;
  name: string | null;
  description: string | null;
  images: string[];
  hasSpecsTab: boolean;
}

function extract(html: string, url: string): Extracted {
  const out: Extracted = {
    eshopId: null,
    sku: null,
    name: null,
    description: null,
    images: [],
    hasSpecsTab: false,
  };

  // eshop_id from URL: /…/{NUM}-{slug}
  const idM = url.match(/\/(\d+)-[^/]+\/?$/);
  if (idM) out.eshopId = Number(idM[1]);

  // h1 → name
  const h1 = html.match(/<h1[^>]*>([^<]+(?:<[^>]+>[^<]*)*)<\/h1>/);
  if (h1) out.name = stripTags(h1[1]);

  // Specs tab → Model field (CANONICAL SKU)
  const specsM = html.match(
    /<li[^>]*class=["'][^"']*tab_item[^"']*tab_2[^"']*["'][^>]*>([\s\S]*?)<\/li>/,
  );
  if (specsM) {
    out.hasSpecsTab = true;
    const specsText = stripTags(specsM[1]);
    // Look for "Model <SKU>" — single canonical pattern.
    const modelM = specsText.match(/\bModel\s+([A-Z0-9]+)\b/);
    if (modelM && SKU_FORMAT.test(modelM[1])) {
      out.sku = modelM[1];
    }
  }

  // Description tab body (tab_1)
  const descM = html.match(
    /<li[^>]*class=["'][^"']*tab_item[^"']*tab_1[^"']*["'][^>]*>([\s\S]*?)<\/li>/,
  );
  if (descM) {
    const desc = descM[1]
      .replace(/<\/?(?:div|p)[^>]*>/g, "\n")
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<strong>([^<]*)<\/strong>/gi, "**$1**")
      .replace(/<[^>]+>/g, "")
      .replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/\s*\n\s*\n\s*/g, "\n\n")
      .trim();
    if (desc.length > 10) out.description = desc;
  }

  // Product images: /assets/site/public/n2/{first2}/{next2}/{eshopId}/...
  // Filter to ONLY this product's eshopId folder to avoid cross-contamination.
  const seenBase = new Set<string>();
  const imgPattern = new RegExp(
    `/assets/site/public/n2/\\d{2}/\\d{2}/${out.eshopId ?? "\\d+"}/[^\\s"'<>]+\\.(?:jpg|jpeg|png|webp)`,
    "gi",
  );
  for (const m of html.matchAll(imgPattern)) {
    // Dedupe thumbnail variants (-5.jpg / -2.jpg etc)
    const base = m[0].replace(/-\d+(\.(?:jpg|jpeg|png|webp))$/i, "$1");
    if (!seenBase.has(base)) {
      seenBase.add(base);
      out.images.push(`${ESHOP_ORIGIN}${m[0]}`);
    }
  }

  return out;
}

// ────────────────────────────────────────────────────────────────────────
// Main pipeline
// ────────────────────────────────────────────────────────────────────────
async function main(): Promise<void> {
  const skuSet = await loadSkuSet();
  let urls = await fetchSitemap();
  if (LIMIT > 0) urls = urls.slice(0, LIMIT);

  console.log(
    `→ scanning ${urls.length} pages (concurrency ${CONCURRENCY}, DRY-RUN, no DB writes)\n`,
  );

  const results: ScrapeResult[] = new Array(urls.length);
  const buckets: Report["buckets"] = {
    valid: 0,
    model_missing: 0,
    sku_unknown: 0,
    model_pattern_invalid: 0,
    fetch_404: 0,
    fetch_error: 0,
  };
  let processed = 0;
  const t0 = Date.now();

  let cursor = 0;
  await Promise.all(
    Array.from({ length: CONCURRENCY }, async () => {
      while (cursor < urls.length) {
        const idx = cursor++;
        const url = urls[idx];
        const r: ScrapeResult = {
          url,
          bucket: "fetch_error",
          eshopId: null,
          sku: null,
          name: null,
          description: null,
          images: [],
        };
        try {
          const html = await fetchHtmlWithRetry(url);
          const ex = extract(html, url);
          r.eshopId = ex.eshopId;
          r.name = ex.name;
          r.description = ex.description;
          r.images = ex.images;
          r.sku = ex.sku;
          if (!ex.hasSpecsTab || !ex.sku) {
            r.bucket = "model_missing";
          } else if (!SKU_FORMAT.test(ex.sku)) {
            r.bucket = "model_pattern_invalid";
          } else if (!skuSet.has(ex.sku)) {
            r.bucket = "sku_unknown";
          } else {
            r.bucket = "valid";
          }
        } catch (e) {
          const msg = e instanceof Error ? e.message : String(e);
          r.bucket = msg === "404" ? "fetch_404" : "fetch_error";
          r.error = msg;
        }
        results[idx] = r;
        buckets[r.bucket]++;
        processed++;
        if (processed % 500 === 0 || processed === urls.length) {
          const rate = processed / ((Date.now() - t0) / 1000);
          const remaining = urls.length - processed;
          const eta = Math.round(remaining / rate);
          console.log(
            `  ${processed}/${urls.length}  valid=${buckets.valid} missing=${buckets.model_missing} unknown=${buckets.sku_unknown} 404=${buckets.fetch_404} err=${buckets.fetch_error}  |  ${rate.toFixed(1)}/s ETA ${Math.floor(eta / 60)}m${eta % 60}s`,
          );
        }
      }
    }),
  );

  // ────────────────────────────────────────────────────────────────
  // Detect SKU conflicts (>1 valid page mapped to same SKU)
  // ────────────────────────────────────────────────────────────────
  const skuPages = new Map<string, string[]>();
  for (const r of results) {
    if (r.bucket === "valid" && r.sku) {
      const arr = skuPages.get(r.sku) ?? [];
      arr.push(r.url);
      skuPages.set(r.sku, arr);
    }
  }
  const conflicts: Report["conflicts"] = [];
  const skuToUrl: Record<string, string> = {};
  for (const [sku, pages] of skuPages.entries()) {
    if (pages.length > 1) conflicts.push({ sku, urls: pages });
    else skuToUrl[sku] = pages[0];
  }

  const report: Report = {
    generatedAt: new Date().toISOString(),
    totalUrls: urls.length,
    buckets,
    conflicts,
    results,
    skuToUrl,
  };

  mkdirSync(dirname(REPORT_FILE), { recursive: true });
  writeFileSync(REPORT_FILE, JSON.stringify(report, null, 2));
  console.log(`\n✓ report written to ${REPORT_FILE}`);

  // ────────────────────────────────────────────────────────────────
  // Summary + confidence calculation
  // ────────────────────────────────────────────────────────────────
  const valid = buckets.valid;
  const conflictCount = conflicts.reduce((s, c) => s + c.urls.length, 0);
  const safeValid = valid - conflictCount; // single-page-per-SKU only
  const denom = valid + buckets.sku_unknown + buckets.model_missing;
  const conf = denom > 0 ? (safeValid / denom) * 100 : 0;

  console.log("\n" + "═".repeat(60));
  console.log(" DRY-RUN SUMMARY (no DB changes made)");
  console.log("═".repeat(60));
  console.log(`  Total URLs scanned:                     ${urls.length}`);
  console.log(`  ✓ valid (Model SKU exists in DB):      ${buckets.valid}`);
  console.log(
    `  • conflicts (same SKU on >1 page):     ${conflictCount} urls / ${conflicts.length} SKUs`,
  );
  console.log(`  • safe-valid (no conflict):            ${safeValid}`);
  console.log(
    `  • model field missing/empty:           ${buckets.model_missing}`,
  );
  console.log(
    `  • model SKU not in our DB:             ${buckets.sku_unknown}`,
  );
  console.log(
    `  • model pattern invalid:               ${buckets.model_pattern_invalid}`,
  );
  console.log(`  • fetch 404:                           ${buckets.fetch_404}`);
  console.log(
    `  • fetch error:                         ${buckets.fetch_error}`,
  );
  console.log(`\n  Confidence (safe-valid / actionable):  ${conf.toFixed(1)}%`);
  console.log(
    `\n  → next: review ${REPORT_FILE}, then run pnpm tsx scripts/apply-scrape.ts to write to DB`,
  );

  // First few conflicts for quick inspection
  if (conflicts.length > 0) {
    console.log("\n  Sample conflicts (first 5):");
    for (const c of conflicts.slice(0, 5)) {
      console.log(`    SKU ${c.sku}:`);
      for (const u of c.urls.slice(0, 3)) console.log(`      - ${u}`);
    }
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
