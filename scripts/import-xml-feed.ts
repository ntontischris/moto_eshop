/**
 * Import product content from the canonical motomarket-shop feed
 * (onlyriders.xml). 100% deterministic via `<ErpID>` ↔ products.erp_id.
 *
 * Run:
 *   pnpm tsx scripts/import-xml-feed.ts             # full import
 *   pnpm tsx scripts/import-xml-feed.ts --dry-run   # show what would change
 *   pnpm tsx scripts/import-xml-feed.ts --limit 100 # first 100 items only
 *
 * Source of truth: data/onlyriders.xml (download from
 *   https://www.motomarket-shop.gr/fileserve/limited/index.php?file=onlyriders.xml
 * before running).
 */

import { config } from "dotenv";
config({ path: ".env.local" });
config({ path: ".env" });

import { createClient } from "@supabase/supabase-js";
import { readFileSync, existsSync } from "fs";
import { XMLParser } from "fast-xml-parser";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } },
);

const XML_FILE = "data/onlyriders.xml";
const dryRun = process.argv.includes("--dry-run");
const limitFlag = process.argv.indexOf("--limit");
const LIMIT = limitFlag >= 0 ? Number(process.argv[limitFlag + 1] ?? "0") : 0;

interface FeedItem {
  SiteID: number;
  ErpID: string;
  Code: string;
  Brand?: string;
  Title?: string;
  Images?: Record<string, string>;
  Colors?: Record<string, string>;
  Sexes?: Record<string, string>;
  ColorVariations?: Record<string, string>;
  TextDescription?: string;
  HtmlDescription?: string;
}

interface UpdatePlan {
  erpId: string;
  productId: string;
  name?: string;
  description?: string;
  images?: { url: string; alt: string; position: number }[];
}

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

// Convert an XML "indexed-children" map like { Image_1: "...", Image_2: "..." }
// into an ordered string[]
function indexed(obj?: Record<string, string>): string[] {
  if (!obj) return [];
  return Object.entries(obj)
    .map(([k, v]) => {
      const m = k.match(/_(\d+)$/);
      return { idx: m ? Number(m[1]) : 9999, val: v };
    })
    .sort((a, b) => a.idx - b.idx)
    .map((e) => e.val)
    .filter((v) => typeof v === "string" && v.length > 0);
}

async function main(): Promise<void> {
  if (!existsSync(XML_FILE)) {
    throw new Error(
      `Feed file not found: ${XML_FILE}\nDownload it from the limited fileserve URL first.`,
    );
  }

  console.log(`→ parsing ${XML_FILE}…`);
  const xml = readFileSync(XML_FILE, "utf8");
  const parser = new XMLParser({
    ignoreAttributes: true,
    cdataPropName: undefined,
    parseTagValue: false,
    trimValues: true,
  });
  const parsed = parser.parse(xml);
  const itemsRaw = parsed?.motomarket?.items?.item;
  if (!Array.isArray(itemsRaw)) {
    throw new Error(
      "Unexpected XML shape — expected motomarket.items.item array",
    );
  }
  let items = itemsRaw as FeedItem[];
  if (LIMIT > 0) items = items.slice(0, LIMIT);
  console.log(`  ${items.length} <item> entries parsed`);

  // ── Build erp_id → product.id map ──────────────────────────────────────
  console.log("→ loading erp_id → id map from products…");
  const idByErp = new Map<string, string>();
  let from = 0;
  const PAGE = 1000;
  while (true) {
    const { data, error } = await supabase
      .from("products")
      .select("id, erp_id")
      .range(from, from + PAGE - 1);
    if (error) throw error;
    if (!data || data.length === 0) break;
    for (const p of data) if (p.erp_id) idByErp.set(p.erp_id, p.id);
    if (data.length < PAGE) break;
    from += PAGE;
  }
  console.log(`  ${idByErp.size} products available for join`);

  // ── Build update plan ─────────────────────────────────────────────────
  const plan: UpdatePlan[] = [];
  let skipNoErpId = 0;
  let skipNotInDb = 0;
  let skipNoContent = 0;
  let imageOnly = 0;
  let nameOnly = 0;
  let totalImages = 0;

  for (const item of items) {
    if (!item.ErpID) {
      skipNoErpId++;
      continue;
    }
    const productId = idByErp.get(item.ErpID);
    if (!productId) {
      skipNotInDb++;
      continue;
    }
    const imageUrls = indexed(item.Images);
    const update: UpdatePlan = {
      erpId: item.ErpID,
      productId,
    };
    if (item.Title && item.Title.trim()) update.name = item.Title.trim();
    if (item.TextDescription && item.TextDescription.trim()) {
      update.description = item.TextDescription.trim();
    }
    if (imageUrls.length > 0) {
      update.images = imageUrls.map((url, idx) => ({
        url,
        alt: update.name ?? item.Code,
        position: idx,
      }));
      totalImages += imageUrls.length;
    }
    if (!update.name && !update.description && !update.images) {
      skipNoContent++;
      continue;
    }
    if (update.images && !update.name) imageOnly++;
    if (update.name && !update.images) nameOnly++;
    plan.push(update);
  }

  console.log("\n=== UPDATE PLAN ===");
  console.log(`  feed items:           ${items.length}`);
  console.log(`  ✓ will update:        ${plan.length}`);
  console.log(`  • skip (no ErpID):    ${skipNoErpId}`);
  console.log(`  • skip (not in DB):   ${skipNotInDb}`);
  console.log(`  • skip (no content):  ${skipNoContent}`);
  console.log(`  ↳ name only:          ${nameOnly}`);
  console.log(`  ↳ images only:        ${imageOnly}`);
  console.log(`  total image URLs:     ${totalImages}`);

  if (dryRun) {
    console.log("\n(--dry-run) — no DB writes. Sample 2:");
    for (const u of plan.slice(0, 2)) {
      console.log(`\n  ${u.erpId}`);
      console.log(`    name:   ${u.name?.slice(0, 80) ?? "(none)"}`);
      console.log(
        `    desc:   ${u.description?.slice(0, 100).replace(/\s+/g, " ") ?? "(none)"}…`,
      );
      console.log(`    images: ${u.images?.length ?? 0}`);
    }
    return;
  }

  // ── Apply: parallel UPDATEs ───────────────────────────────────────────
  console.log("\n→ writing updates (concurrency 25)…");
  let success = 0;
  let failed = 0;
  let processed = 0;
  const t0 = Date.now();
  let cursor = 0;
  await Promise.all(
    Array.from({ length: 25 }, async () => {
      while (cursor < plan.length) {
        const i = cursor++;
        const u = plan[i];
        const patch: Record<string, unknown> = {};
        if (u.name) patch.name = u.name;
        if (u.description) patch.description = u.description;
        if (u.images) patch.images = u.images;
        const { error } = await supabase
          .from("products")
          .update(patch)
          .eq("id", u.productId);
        if (error) {
          failed++;
          if (failed <= 5) console.error(`  ✗ ${u.erpId}: ${error.message}`);
        } else {
          success++;
        }
        processed++;
        if (processed % 500 === 0) {
          const rate = processed / ((Date.now() - t0) / 1000);
          const eta = Math.round((plan.length - processed) / rate);
          console.log(
            `  ${processed}/${plan.length}  ✓ ${success}  ✗ ${failed}  |  ${rate.toFixed(1)}/s  ETA ${Math.floor(eta / 60)}m${eta % 60}s`,
          );
        }
      }
    }),
  );

  console.log("\n" + "═".repeat(60));
  console.log(" IMPORT SUMMARY");
  console.log("═".repeat(60));
  console.log(`  ✓ updated:       ${success}`);
  console.log(`  ✗ failed:        ${failed}`);
  console.log(`  elapsed:         ${((Date.now() - t0) / 1000).toFixed(1)}s`);

  // Verification samples
  console.log("\n→ verification (3 random samples):");
  const sampled = plan.sort(() => Math.random() - 0.5).slice(0, 3);
  for (const u of sampled) {
    const { data } = await supabase
      .from("products")
      .select("sku, name, description, images")
      .eq("id", u.productId)
      .single();
    if (data) {
      const imgs = Array.isArray(data.images) ? data.images.length : 0;
      console.log(`\n  ${data.sku}`);
      console.log(`    name:   ${data.name?.slice(0, 70)}`);
      console.log(
        `    desc:   ${data.description?.slice(0, 90).replace(/\s+/g, " ")}…`,
      );
      console.log(`    images: ${imgs}`);
    }
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
