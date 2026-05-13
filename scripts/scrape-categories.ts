/**
 * Scrape the category tree from motomarket-shop.gr.
 *
 *   sitemap-categories.xml.gz lists every category URL. We fetch each
 *   Greek page, extract the <h1> (Greek name) and meta description,
 *   then build a parent-child tree from the URL path.
 *
 *   Output: data/categories-tree.json
 *
 *   Use scripts/apply-categories.ts to write to the DB after review.
 */

import { config } from "dotenv";
config({ path: ".env.local" });
config({ path: ".env" });

import { createGunzip } from "zlib";
import { Readable } from "stream";
import { writeFileSync, mkdirSync } from "fs";
import { dirname } from "path";

const SITEMAP_URL = "https://www.motomarket-shop.gr/sitemap-categories.xml.gz";
const USER_AGENT = "MotomarketMigration/1.0 (dev@motomarket.gr)";
const CONCURRENCY = 8;
const OUTPUT = "data/categories-tree.json";
const TIMEOUT_MS = 25_000;
const RETRIES = 3;

interface CategoryNode {
  slug: string; // last path segment, e.g. "mpoyfan"
  url: string; // full URL on legacy eshop
  path: string[]; // full segment list, e.g. ["eksoplismos-anabath", "endysh", "mpoyfan"]
  parentSlug: string | null;
  level: number; // 1 = top
  name: string | null; // <h1> in Greek
  description: string | null; // meta or seo intro
  imageUrl: string | null; // category banner if visible
  productCount: number | null; // if shown on listing
  fetchError?: string;
}

async function fetchSitemap(): Promise<string[]> {
  console.log("→ fetching sitemap-categories.xml.gz…");
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
  console.log(`  ${gr.length} Greek category URLs`);
  return gr;
}

async function fetchHtml(url: string): Promise<string> {
  for (let attempt = 1; attempt <= RETRIES; attempt++) {
    try {
      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
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

function stripTags(s: string): string {
  return s
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, " ")
    .trim();
}

function parseUrl(url: string): { path: string[]; slug: string } {
  // strip protocol + host
  const u = new URL(url);
  const segs = u.pathname.split("/").filter((s) => s.length > 0);
  return { path: segs, slug: segs[segs.length - 1] ?? "" };
}

function extract(html: string): {
  h1: string | null;
  description: string | null;
  imageUrl: string | null;
  productCount: number | null;
} {
  // h1
  const h1m = html.match(/<h1[^>]*>([^<]+(?:<[^>]+>[^<]*)*)<\/h1>/);
  const h1 = h1m ? stripTags(h1m[1]) : null;

  // meta description
  const metaM = html.match(
    /<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i,
  );
  const description = metaM ? metaM[1].trim() : null;

  // category banner image (best-effort)
  const banM =
    html.match(
      /\/assets\/site\/public\/[^\s"'<>]*?categor[^\s"'<>]*\.(?:jpg|jpeg|png|webp)/i,
    ) ??
    html.match(
      /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i,
    );
  const imageUrl = banM
    ? typeof banM[0] === "string" && banM[0].startsWith("/")
      ? `https://www.motomarket-shop.gr${banM[0]}`
      : ((banM as RegExpMatchArray)[1] ?? null)
    : null;

  // product count (best-effort: looks for "(123)" near top of listing)
  const countM = html.match(/(\d{1,5})\s*προϊ[όο]ντ/i);
  const productCount = countM ? Number(countM[1]) : null;

  return { h1, description, imageUrl, productCount };
}

async function main(): Promise<void> {
  const urls = await fetchSitemap();

  console.log(
    `\n→ scraping ${urls.length} category pages (concurrency ${CONCURRENCY})…`,
  );
  const results: CategoryNode[] = [];
  let processed = 0;
  const t0 = Date.now();
  let cursor = 0;
  await Promise.all(
    Array.from({ length: CONCURRENCY }, async () => {
      while (cursor < urls.length) {
        const url = urls[cursor++];
        const { path, slug } = parseUrl(url);
        const node: CategoryNode = {
          slug,
          url,
          path,
          parentSlug: path.length > 1 ? path[path.length - 2] : null,
          level: path.length,
          name: null,
          description: null,
          imageUrl: null,
          productCount: null,
        };
        try {
          const html = await fetchHtml(url);
          const ex = extract(html);
          node.name = ex.h1;
          node.description = ex.description;
          node.imageUrl = ex.imageUrl;
          node.productCount = ex.productCount;
        } catch (e) {
          node.fetchError = e instanceof Error ? e.message : String(e);
        }
        results.push(node);
        processed++;
        if (processed % 100 === 0 || processed === urls.length) {
          const rate = processed / ((Date.now() - t0) / 1000);
          const eta = Math.round((urls.length - processed) / rate);
          console.log(
            `  ${processed}/${urls.length}  |  ${rate.toFixed(1)}/s  ETA ${Math.floor(eta / 60)}m${eta % 60}s`,
          );
        }
      }
    }),
  );

  // Stats
  const named = results.filter((r) => r.name).length;
  const errored = results.filter((r) => r.fetchError).length;
  const levelDist: Record<number, number> = {};
  for (const r of results) levelDist[r.level] = (levelDist[r.level] ?? 0) + 1;

  // Sort: by level asc, then path
  results.sort(
    (a, b) =>
      a.level - b.level || a.path.join("/").localeCompare(b.path.join("/")),
  );

  mkdirSync(dirname(OUTPUT), { recursive: true });
  writeFileSync(OUTPUT, JSON.stringify(results, null, 2));

  console.log("\n=== Summary ===");
  console.log(`  total:      ${results.length}`);
  console.log(`  ✓ named:   ${named}`);
  console.log(`  ✗ errors:  ${errored}`);
  console.log("  by level:");
  for (const [k, v] of Object.entries(levelDist).sort(
    (a, b) => Number(a[0]) - Number(b[0]),
  )) {
    console.log(`    L${k}: ${v}`);
  }
  console.log(`\n  wrote: ${OUTPUT}`);

  console.log("\n=== Level 1 categories (sample) ===");
  for (const r of results.filter((x) => x.level === 1).slice(0, 12)) {
    console.log(`  ${r.slug.padEnd(35)} → ${r.name ?? "(no name)"}`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
