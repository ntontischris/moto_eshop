/**
 * Scrape product names, descriptions, and image URLs from
 * the legacy motomarket-shop.gr eshop and overlay them onto the
 * products table (matched by SKU).
 *
 * Phase 1: metadata + image URLs only (does NOT download image files;
 * we'll mirror those to our CDN later as a separate batch).
 *
 * Usage:
 *   pnpm tsx scripts/scrape-eshop.ts             # full run, resumes if state file present
 *   pnpm tsx scripts/scrape-eshop.ts --limit 50  # only first 50 pages (smoke test)
 *   pnpm tsx scripts/scrape-eshop.ts --reset     # ignore previous progress
 *   pnpm tsx scripts/scrape-eshop.ts --lang gr   # default; only Greek pages
 */

import { config } from "dotenv";
config({ path: ".env.local" });
config({ path: ".env" });

import { createClient } from "@supabase/supabase-js";
import { createGunzip } from "zlib";
import { Readable } from "stream";
import { existsSync, readFileSync, writeFileSync, mkdirSync } from "fs";
import { dirname } from "path";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error("Missing Supabase env vars");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const SITEMAP_URL = "https://www.motomarket-shop.gr/sitemap-products.xml.gz";
const ESHOP_ORIGIN = "https://www.motomarket-shop.gr";
const USER_AGENT = "MotomarketMigration/1.0 (contact: dev@motomarket.gr)";
const PROGRESS_FILE = "data/scrape-progress.json";
const CONCURRENCY = 8;
const PER_REQUEST_TIMEOUT_MS = 25_000;
const RETRIES = 3;

interface Progress {
  done: string[]; // URLs already processed
  failed: { url: string; error: string }[];
  matched: number;
  unmatched: number;
  startedAt: string;
  lastSavedAt: string;
}

// ---------- arg parsing ----------
const args = new Set(process.argv.slice(2));
const reset = args.has("--reset");
const limitFlag = process.argv.indexOf("--limit");
const limit = limitFlag >= 0 ? Number(process.argv[limitFlag + 1] ?? "0") : 0;

// ---------- helpers ----------
function loadProgress(): Progress {
  if (!reset && existsSync(PROGRESS_FILE)) {
    return JSON.parse(readFileSync(PROGRESS_FILE, "utf8")) as Progress;
  }
  return {
    done: [],
    failed: [],
    matched: 0,
    unmatched: 0,
    startedAt: new Date().toISOString(),
    lastSavedAt: new Date().toISOString(),
  };
}

function saveProgress(p: Progress): void {
  p.lastSavedAt = new Date().toISOString();
  mkdirSync(dirname(PROGRESS_FILE), { recursive: true });
  writeFileSync(PROGRESS_FILE, JSON.stringify(p, null, 2), "utf8");
}

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
  console.log(`  got ${urls.length} URLs`);
  // Greek-only: skip /en/
  const gr = urls.filter((u) => !u.includes("/en/"));
  console.log(`  Greek-only: ${gr.length}`);
  return gr;
}

async function fetchHtmlWithRetry(url: string): Promise<string> {
  for (let attempt = 1; attempt <= RETRIES; attempt++) {
    try {
      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort(), PER_REQUEST_TIMEOUT_MS);
      const resp = await fetch(url, {
        headers: {
          "User-Agent": USER_AGENT,
          Accept: "text/html,application/xhtml+xml",
          "Accept-Language": "el-GR,el;q=0.9",
        },
        signal: ctrl.signal,
      });
      clearTimeout(t);
      if (resp.status === 404) throw new Error("404 (not found, not retrying)");
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      return await resp.text();
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      if (msg.includes("404 (not found")) throw e;
      if (attempt === RETRIES) throw e;
      const backoff = 500 * 2 ** (attempt - 1) + Math.random() * 200;
      await new Promise((r) => setTimeout(r, backoff));
    }
  }
  throw new Error("unreachable");
}

interface Extracted {
  name: string | null;
  description: string | null;
  specifications: string | null;
  images: string[];
  sku: string | null;
  /** eshop's numeric product id, useful as a secondary join key */
  eshopProductId: number | null;
  /** Greek breadcrumb path */
  breadcrumb: string[];
}

function extract(html: string, url: string): Extracted {
  // ── title (H1) ─────────────────────────────────────────────
  const h1Match = html.match(/<h1[^>]*>([^<]+(?:<[^>]+>[^<]*)*)<\/h1>/);
  const name = h1Match
    ? h1Match[1].replace(/<[^>]+>/g, "").trim() || null
    : null;

  // ── description tab (data-tab="1") ─────────────────────────
  // The page has TWO <li data-tab="1">: the tab title (just "Περιγραφή")
  // and the tab body (class includes "tab_item"). Match the body only.
  let description: string | null = null;
  const descMatch = html.match(
    /<li[^>]*class=["'][^"']*tab_item[^"']*tab_1[^"']*["'][^>]*>([\s\S]*?)<\/li>/,
  );
  if (descMatch) {
    description = descMatch[1]
      .replace(/<\/?(?:div|p)[^>]*>/g, "\n")
      .replace(/<br\s*\/?>/g, "\n")
      .replace(/<strong>([^<]*)<\/strong>/g, "**$1**")
      .replace(/<[^>]+>/g, "")
      .replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/\s*\n\s*\n\s*/g, "\n\n")
      .trim();
    if (description.length < 5) description = null;
  }

  // ── specifications tab (data-tab="2") ──────────────────────
  let specifications: string | null = null;
  const specMatch = html.match(
    /<li[^>]*class=["'][^"']*tab_item[^"']*tab_2[^"']*["'][^>]*>([\s\S]*?)<\/li>/,
  );
  if (specMatch) {
    specifications = specMatch[1]
      .replace(/<\/?(?:div|p|table|tr|td)[^>]*>/g, " ")
      .replace(/<br\s*\/?>/g, "\n")
      .replace(/<[^>]+>/g, "")
      .replace(/&nbsp;/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    if (specifications.length < 5) specifications = null;
  }

  // ── product images (assets/site/public/n2/...) ─────────────
  const images = Array.from(
    new Set(
      Array.from(
        html.matchAll(
          /\/assets\/site\/public\/n2\/[^\s"'<>]+\.(?:jpg|jpeg|png|webp)/gi,
        ),
      ).map((m) => `${ESHOP_ORIGIN}${m[0]}`),
    ),
  );

  // Skip pre-rendered thumbnail dupes that just append "-N.jpg"
  // Keep one image per base name.
  const baseSeen = new Set<string>();
  const dedupedImages: string[] = [];
  for (const img of images) {
    const base = img.replace(/-\d+\.(jpg|jpeg|png|webp)$/i, ".$1");
    if (!baseSeen.has(base)) {
      baseSeen.add(base);
      dedupedImages.push(img);
    }
  }

  // ── SKU extraction ─────────────────────────────────────────
  // Real eshop SKUs follow two distinct shapes:
  //   A) LETTERS+DIGITS+LETTERS+DIGITS  e.g. HJC000KRA404, RUK000JAC14
  //   B) LETTERS+DIGITS                 e.g. GIVHONKIT01, QLCUNILOC28
  // Plus they appear 2-3× per page, while random tokens appear once.
  // Strategy: collect all uppercase-alphanum tokens of length 7-15, count
  // occurrences, prefer those present in our DB SKU set, then by frequency.
  let sku: string | null = null;
  const counts = new Map<string, number>();
  for (const m of html.matchAll(/\b([A-Z]{2,}\d+[A-Z\d]*)\b/g)) {
    const t = m[1];
    if (t.length < 7 || t.length > 18) continue;
    counts.set(t, (counts.get(t) ?? 0) + 1);
  }
  if (counts.size > 0) {
    // Sort: DB-known first, then by frequency, then by length
    const candidates = Array.from(counts.entries())
      .map(([token, n]) => ({ token, n, inDb: skuToProduct.has(token) }))
      .sort(
        (a, b) =>
          Number(b.inDb) - Number(a.inDb) ||
          b.n - a.n ||
          b.token.length - a.token.length,
      );
    sku = candidates[0].token;
  }

  // ── eshop product id from URL pattern: /…/{id}-{slug} ──────
  const idMatch = url.match(/\/(\d+)-[^/]+\/?$/);
  const eshopProductId = idMatch ? Number(idMatch[1]) : null;

  // ── breadcrumb (best-effort) ───────────────────────────────
  // We don't strictly need it because category_codes already come from ERP.
  const breadcrumb: string[] = [];

  return {
    name,
    description,
    specifications,
    images: dedupedImages,
    sku,
    eshopProductId,
    breadcrumb,
  };
}

// ---------- per-SKU DB update ----------
interface ProductLookup {
  id: string;
  erp_id: string;
}
const skuToProduct = new Map<string, ProductLookup>();

async function loadSkuMap(): Promise<void> {
  console.log("→ loading SKU → product map…");
  const PAGE = 1000;
  let from = 0;
  while (true) {
    const { data, error } = await supabase
      .from("products")
      .select("id, erp_id, sku")
      .range(from, from + PAGE - 1);
    if (error) throw error;
    if (!data || data.length === 0) break;
    for (const p of data) {
      if (p.sku) skuToProduct.set(p.sku, { id: p.id, erp_id: p.erp_id });
    }
    if (data.length < PAGE) break;
    from += PAGE;
  }
  console.log(`  loaded ${skuToProduct.size} products with SKU`);
}

async function applyToDb(
  sku: string,
  data: Extracted,
): Promise<"matched" | "unmatched" | "error"> {
  const p = skuToProduct.get(sku);
  if (!p) return "unmatched";
  const update: Record<string, unknown> = {};
  if (data.name) update.name = data.name;
  if (data.description) update.description = data.description;
  if (data.images.length > 0) update.images = data.images;
  if (data.specifications) {
    // Merge specs into specs jsonb under a single 'overview' key
    update.specs = { overview: data.specifications };
  }
  if (Object.keys(update).length === 0) return "matched"; // nothing to write
  const { error } = await supabase
    .from("products")
    .update(update)
    .eq("id", p.id);
  if (error) {
    console.error(`  ✗ DB update ${sku}: ${error.message}`);
    return "error";
  }
  return "matched";
}

// ---------- concurrency pool ----------
async function processWithPool(
  urls: string[],
  worker: (url: string) => Promise<void>,
  concurrency: number,
): Promise<void> {
  let idx = 0;
  const runners = Array.from({ length: concurrency }, async () => {
    while (true) {
      const i = idx++;
      if (i >= urls.length) return;
      await worker(urls[i]);
    }
  });
  await Promise.all(runners);
}

// ---------- main ----------
async function main(): Promise<void> {
  await loadSkuMap();

  const allUrls = await fetchSitemap();
  const progress = loadProgress();
  const doneSet = new Set(progress.done);

  let urls = allUrls.filter((u) => !doneSet.has(u));
  if (limit > 0) urls = urls.slice(0, limit);

  console.log(
    `→ ${urls.length} URLs to process (skipping ${doneSet.size} already done)`,
  );

  let processed = 0;
  const t0 = Date.now();
  const flushEvery = 100;

  await processWithPool(
    urls,
    async (url) => {
      try {
        const html = await fetchHtmlWithRetry(url);
        const data = extract(html, url);

        if (!data.sku) {
          progress.unmatched++;
        } else {
          const r = await applyToDb(data.sku, data);
          if (r === "matched") progress.matched++;
          else if (r === "unmatched") progress.unmatched++;
        }
        progress.done.push(url);
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        progress.failed.push({ url, error: msg });
        progress.done.push(url); // don't keep retrying in same run
      }
      processed++;
      if (processed % flushEvery === 0) {
        saveProgress(progress);
        const rate = processed / ((Date.now() - t0) / 1000);
        const remaining = urls.length - processed;
        const etaSec = Math.round(remaining / rate);
        console.log(
          `  ${processed}/${urls.length} | matched=${progress.matched} unmatched=${progress.unmatched} failed=${progress.failed.length} | ${rate.toFixed(1)}/s | ETA ${Math.floor(etaSec / 60)}m${etaSec % 60}s`,
        );
      }
    },
    CONCURRENCY,
  );

  saveProgress(progress);
  const totalSec = (Date.now() - t0) / 1000;
  console.log(
    `\n✓ done in ${Math.floor(totalSec / 60)}m${Math.round(totalSec % 60)}s`,
  );
  console.log(`  matched (SKU found in DB & updated): ${progress.matched}`);
  console.log(
    `  unmatched (no SKU on page or not in DB): ${progress.unmatched}`,
  );
  console.log(
    `  failed (network / parse errors):        ${progress.failed.length}`,
  );
  if (progress.failed.length > 0) {
    console.log(`\n  first 5 failures:`);
    progress.failed
      .slice(0, 5)
      .forEach((f) => console.log(`    ${f.url}\n      → ${f.error}`));
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
