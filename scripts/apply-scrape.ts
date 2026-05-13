/**
 * Stage 2: apply the validated scrape results to the products table.
 *
 * Reads data/dryrun-report.json and updates products with name, description,
 * images — ONLY for entries that were marked `valid` and not in conflict.
 *
 * Conflicts (same SKU on multiple pages): pick the URL with the richer
 * content (more images, then longer description) and log to
 * data/apply-conflicts.log for review.
 *
 * Images are stored as ProductImage[] objects ({url, alt, position}) so
 * the UI (ImageGallery) consumes them natively. URLs stay as the original
 * eshop URL; the storefront rewrites them through /api/image-proxy at
 * read time.
 *
 * Run: pnpm tsx scripts/apply-scrape.ts [--dry-run]
 */

import { config } from "dotenv";
config({ path: ".env.local" });
config({ path: ".env" });

import { createClient } from "@supabase/supabase-js";
import { readFileSync, writeFileSync, mkdirSync } from "fs";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } },
);

const dryRun = process.argv.includes("--dry-run");
const REPORT_FILE = "data/dryrun-report.json";
const CONFLICT_LOG = "data/apply-conflicts.log";

interface ScrapeResult {
  url: string;
  bucket: string;
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
  skuToUrl: Record<string, string>;
}

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

async function main(): Promise<void> {
  console.log(`→ reading ${REPORT_FILE}…`);
  const report: Report = JSON.parse(readFileSync(REPORT_FILE, "utf8"));
  console.log(
    `  generated: ${report.generatedAt}  |  totalUrls: ${report.totalUrls}`,
  );

  // ────────────────────────────────────────────────────────────────
  // Resolve conflicts: pick winner per conflicting SKU
  // ────────────────────────────────────────────────────────────────
  const resultByUrl = new Map(report.results.map((r) => [r.url, r]));
  const conflictWinners = new Map<string, ScrapeResult>();
  const conflictLog: string[] = [
    `# Conflict resolutions @ ${new Date().toISOString()}`,
    `# strategy: most images, then longest description`,
    "",
  ];
  for (const { sku, urls } of report.conflicts) {
    const candidates = urls
      .map((u) => resultByUrl.get(u))
      .filter((r): r is ScrapeResult => !!r);
    candidates.sort((a, b) => {
      if (a.images.length !== b.images.length)
        return b.images.length - a.images.length;
      return (b.description?.length ?? 0) - (a.description?.length ?? 0);
    });
    const winner = candidates[0];
    conflictWinners.set(sku, winner);
    conflictLog.push(
      `SKU ${sku}: chose ${winner.url} (${winner.images.length} imgs, ${winner.description?.length ?? 0} desc chars)`,
    );
    for (const c of candidates.slice(1)) {
      conflictLog.push(
        `        rejected ${c.url} (${c.images.length} imgs, ${c.description?.length ?? 0} desc chars)`,
      );
    }
  }
  mkdirSync("data", { recursive: true });
  writeFileSync(CONFLICT_LOG, conflictLog.join("\n"), "utf8");

  // ────────────────────────────────────────────────────────────────
  // Build final SKU → ScrapeResult map (winners only)
  // ────────────────────────────────────────────────────────────────
  const updates = new Map<string, ScrapeResult>();
  // single-page SKUs
  for (const [sku, url] of Object.entries(report.skuToUrl)) {
    const r = resultByUrl.get(url);
    if (r) updates.set(sku, r);
  }
  // conflict winners
  for (const [sku, r] of conflictWinners) updates.set(sku, r);

  console.log(`\n→ will update ${updates.size} products`);
  console.log(
    `  ↳ from single-page SKUs:    ${Object.keys(report.skuToUrl).length}`,
  );
  console.log(`  ↳ from conflict winners:    ${conflictWinners.size}`);

  if (dryRun) {
    console.log("\n(--dry-run) — no DB changes. Exiting.");
    return;
  }

  // ────────────────────────────────────────────────────────────────
  // Apply: SKU → DB id lookup, then parallel UPDATEs
  // ────────────────────────────────────────────────────────────────
  console.log("\n→ resolving SKU → product id map…");
  const idBySku = new Map<string, string>();
  const skuList = Array.from(updates.keys());
  for (const batch of chunk(skuList, 1000)) {
    const { data, error } = await supabase
      .from("products")
      .select("id, sku")
      .in("sku", batch);
    if (error) throw error;
    for (const p of data ?? []) idBySku.set(p.sku, p.id);
  }
  console.log(`  resolved ${idBySku.size} / ${updates.size}`);

  console.log("\n→ writing updates (concurrency 25)…");
  let success = 0;
  let failed = 0;
  let processed = 0;
  const t0 = Date.now();

  const sourceList = Array.from(updates.entries());
  let cursor = 0;
  await Promise.all(
    Array.from({ length: 25 }, async () => {
      while (cursor < sourceList.length) {
        const i = cursor++;
        const [sku, r] = sourceList[i];
        const id = idBySku.get(sku);
        if (!id) {
          failed++;
          processed++;
          continue;
        }
        // Build image objects with position
        const imageObjects = r.images.map((url, idx) => ({
          url,
          alt: r.name ?? sku,
          position: idx,
        }));
        const patch: Record<string, unknown> = {};
        if (r.name) patch.name = r.name;
        if (r.description) patch.description = r.description;
        if (imageObjects.length > 0) patch.images = imageObjects;
        if (Object.keys(patch).length === 0) {
          processed++;
          continue;
        }
        const { error } = await supabase
          .from("products")
          .update(patch)
          .eq("id", id);
        if (error) {
          failed++;
          if (failed <= 5) console.error(`  ✗ ${sku}: ${error.message}`);
        } else {
          success++;
        }
        processed++;
        if (processed % 500 === 0) {
          const rate = processed / ((Date.now() - t0) / 1000);
          const eta = Math.round((sourceList.length - processed) / rate);
          console.log(
            `  ${processed}/${sourceList.length}  ✓ ${success}  ✗ ${failed}  |  ${rate.toFixed(1)}/s  ETA ${Math.floor(eta / 60)}m${eta % 60}s`,
          );
        }
      }
    }),
  );

  const totalSec = ((Date.now() - t0) / 1000).toFixed(1);
  console.log("\n" + "═".repeat(60));
  console.log(" APPLY SUMMARY");
  console.log("═".repeat(60));
  console.log(`  ✓ updated:       ${success}`);
  console.log(`  ✗ failed:        ${failed}`);
  console.log(`  total processed: ${processed}`);
  console.log(`  conflicts log:   ${CONFLICT_LOG}`);
  console.log(`  elapsed:         ${totalSec}s`);

  // ────────────────────────────────────────────────────────────────
  // Verify a sample
  // ────────────────────────────────────────────────────────────────
  console.log("\n→ verification (3 random samples):");
  const sampleSkus = sourceList
    .sort(() => Math.random() - 0.5)
    .slice(0, 3)
    .map(([sku]) => sku);
  for (const sku of sampleSkus) {
    const { data } = await supabase
      .from("products")
      .select("sku, name, description, images")
      .eq("sku", sku)
      .single();
    if (data) {
      console.log(`\n  ${sku}`);
      console.log(`    name:   ${data.name?.slice(0, 60)}`);
      console.log(
        `    desc:   ${data.description?.slice(0, 80).replace(/\n/g, " ")}…`,
      );
      console.log(
        `    images: ${Array.isArray(data.images) ? data.images.length : 0}`,
      );
    }
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
