/**
 * Link each product to its leaf category.
 *
 *   1. Parse sitemap-products.xml.gz → URL ↔ SiteID
 *   2. Parse onlyriders.xml         → SiteID ↔ ErpID
 *   3. For each URL, the path before the final {siteId}-{slug} segment
 *      is the category path. The last segment of that path is the leaf
 *      category — we look it up in our categories table (by uniqueSlug:
 *      parent--leaf, falling back to leaf only).
 *   4. UPDATE products SET category_id = ? WHERE erp_id = ?
 */

import { config } from "dotenv";
config({ path: ".env.local" });
config({ path: ".env" });

import { createClient } from "@supabase/supabase-js";
import { createGunzip } from "zlib";
import { Readable } from "stream";
import { readFileSync } from "fs";
import { XMLParser } from "fast-xml-parser";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } },
);

const SITEMAP_URL = "https://www.motomarket-shop.gr/sitemap-products.xml.gz";

interface ProductUrlInfo {
  url: string;
  siteId: number;
  categoryPath: string[]; // e.g. ["eksoplismos-anabath","kranh-endoep-nies-kameres","full-face"]
}

async function fetchSitemap(): Promise<ProductUrlInfo[]> {
  console.log("→ fetching sitemap-products.xml.gz…");
  const resp = await fetch(SITEMAP_URL, {
    headers: { "User-Agent": "MotomarketMigration/1.0" },
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
  const urls = Array.from(xml.matchAll(/<loc>([^<]+)<\/loc>/g))
    .map((m) => m[1])
    .filter((u) => !u.includes("/en/"));

  const out: ProductUrlInfo[] = [];
  for (const url of urls) {
    const u = new URL(url);
    const segs = u.pathname.split("/").filter((s) => s.length > 0);
    // last segment is "{siteId}-{slug}"
    const last = segs[segs.length - 1] ?? "";
    const m = last.match(/^(\d+)-/);
    if (!m) continue;
    const siteId = Number(m[1]);
    const categoryPath = segs.slice(0, -1); // everything before the product slug
    out.push({ url, siteId, categoryPath });
  }
  console.log(`  ${out.length} GR product URLs with siteId`);
  return out;
}

async function main(): Promise<void> {
  const productUrls = await fetchSitemap();

  // SiteID → ErpID from onlyriders.xml
  console.log("→ parsing onlyriders.xml for SiteID ↔ ErpID…");
  const parser = new XMLParser({
    ignoreAttributes: true,
    parseTagValue: false,
  });
  const feed = parser.parse(readFileSync("data/onlyriders.xml", "utf8"));
  const items = feed.motomarket.items.item as Array<{
    SiteID: number | string;
    ErpID: string;
  }>;
  const erpBySite = new Map<number, string>();
  for (const it of items) {
    if (it.SiteID && it.ErpID) erpBySite.set(Number(it.SiteID), it.ErpID);
  }
  console.log(`  ${erpBySite.size} SiteID → ErpID mappings`);

  // Build slug→id map for categories. We need both:
  //   - uniqueSlug = "parent--leaf"
  //   - plain leaf slug (fallback)
  console.log("→ loading categories…");
  const idByUnique = new Map<string, string>();
  const idByLeaf = new Map<string, string>();
  let from = 0;
  while (true) {
    const { data, error } = await supabase
      .from("categories")
      .select("id, slug")
      .range(from, from + 1000 - 1);
    if (error) throw error;
    if (!data || data.length === 0) break;
    for (const c of data) {
      idByUnique.set(c.slug, c.id);
      // The leaf portion is everything after the last "--"
      const leaf = c.slug.split("--").pop() ?? c.slug;
      // Only set if leaf isn't already taken to avoid clobbering deeper hits
      if (!idByLeaf.has(leaf)) idByLeaf.set(leaf, c.id);
    }
    if (data.length < 1000) break;
    from += 1000;
  }
  console.log(
    `  ${idByUnique.size} categories (unique), ${idByLeaf.size} distinct leaf slugs`,
  );

  // ErpID → product.id
  console.log("→ loading erp_id → product.id…");
  const idByErp = new Map<string, string>();
  from = 0;
  while (true) {
    const { data, error } = await supabase
      .from("products")
      .select("id, erp_id")
      .range(from, from + 1000 - 1);
    if (error) throw error;
    if (!data || data.length === 0) break;
    for (const p of data) if (p.erp_id) idByErp.set(p.erp_id, p.id);
    if (data.length < 1000) break;
    from += 1000;
  }
  console.log(`  ${idByErp.size} products`);

  // ── Build update plan ──────────────────────────────────────────────
  console.log("\n→ building plan…");
  const updates: { productId: string; categoryId: string }[] = [];
  let unmatchedNoErp = 0;
  let unmatchedNoCat = 0;
  let unmatchedNoProduct = 0;

  for (const p of productUrls) {
    const erpId = erpBySite.get(p.siteId);
    if (!erpId) {
      unmatchedNoErp++;
      continue;
    }
    const productId = idByErp.get(erpId);
    if (!productId) {
      unmatchedNoProduct++;
      continue;
    }
    if (p.categoryPath.length === 0) {
      unmatchedNoCat++;
      continue;
    }
    // Try uniqueSlug first: parent--leaf
    const leafSlug = p.categoryPath[p.categoryPath.length - 1];
    const parentSlug =
      p.categoryPath.length >= 2
        ? p.categoryPath[p.categoryPath.length - 2]
        : null;
    const compositeSlug = parentSlug ? `${parentSlug}--${leafSlug}` : leafSlug;
    let categoryId = idByUnique.get(compositeSlug);
    if (!categoryId) categoryId = idByLeaf.get(leafSlug);
    if (!categoryId) {
      unmatchedNoCat++;
      continue;
    }
    updates.push({ productId, categoryId });
  }

  console.log("\n=== Plan ===");
  console.log(`  ✓ will update:                ${updates.length}`);
  console.log(`  • skip (siteId not in feed):  ${unmatchedNoErp}`);
  console.log(`  • skip (erpId not in db):     ${unmatchedNoProduct}`);
  console.log(`  • skip (category not found):  ${unmatchedNoCat}`);

  // ── Apply ──────────────────────────────────────────────────────────
  console.log("\n→ writing updates (concurrency 25)…");
  let success = 0;
  let failed = 0;
  let processed = 0;
  const t0 = Date.now();
  let cursor = 0;
  await Promise.all(
    Array.from({ length: 25 }, async () => {
      while (cursor < updates.length) {
        const i = cursor++;
        const u = updates[i];
        const { error } = await supabase
          .from("products")
          .update({ category_id: u.categoryId })
          .eq("id", u.productId);
        if (error) {
          failed++;
          if (failed <= 5)
            console.error(`  ✗ ${u.productId}: ${error.message}`);
        } else success++;
        processed++;
        if (processed % 500 === 0) {
          const rate = processed / ((Date.now() - t0) / 1000);
          const eta = Math.round((updates.length - processed) / rate);
          console.log(
            `  ${processed}/${updates.length}  ✓ ${success}  ✗ ${failed}  |  ${rate.toFixed(1)}/s  ETA ${Math.floor(eta / 60)}m${eta % 60}s`,
          );
        }
      }
    }),
  );

  console.log("\n=== Result ===");
  console.log(`  ✓ updated:  ${success}`);
  console.log(`  ✗ failed:   ${failed}`);
  console.log(`  elapsed:    ${((Date.now() - t0) / 1000).toFixed(1)}s`);

  // Distribution
  const { count: withCat } = await supabase
    .from("products")
    .select("*", { count: "exact", head: true })
    .not("category_id", "is", null);
  console.log(`\n  products with category_id (after): ${withCat}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
