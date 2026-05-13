/**
 * Roll back all data that came from the legacy-eshop scraper, leaving only
 * what we sourced directly from the Entersoft API (which we trust 100%).
 *
 * Cleared per product:
 *   - name         → reset to sku   (was the eshop H1, possibly mis-matched)
 *   - description  → null           (was scraped marketing copy)
 *   - images       → '[]'           (URLs may belong to a different product)
 *   - specs        → '{}'           (scraped specifications tab)
 *
 * Kept (all sourced from API):
 *   - erp_id, sku, slug, brand_id, price, wholesale_price, barcodes,
 *     category_codes, sizes, status, stock, last_synced_at, ...
 *
 * Run: pnpm tsx scripts/reset-to-api-only.ts [--dry-run]
 */

import { config } from "dotenv";
config({ path: ".env.local" });
config({ path: ".env" });
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

const dryRun = process.argv.includes("--dry-run");

async function main(): Promise<void> {
  // Before counts
  const { count: before } = await supabase
    .from("products")
    .select("*", { count: "exact", head: true })
    .not("description", "is", null);

  console.log(
    `Before: ${before} products have a description (will be cleared).`,
  );

  if (dryRun) {
    console.log("(dry-run) — no changes.");
    return;
  }

  // Step 1: reset descriptions and specs to defaults, name → sku
  // Have to do this in pages because Supabase has a default row limit.
  console.log(
    "\nPhase 1/2: resetting name → sku, clearing description/specs...",
  );
  let processed = 0;
  const PAGE = 500;
  while (true) {
    const { data, error } = await supabase
      .from("products")
      .select("id, sku")
      .or("description.not.is.null,specs.neq.{}")
      .limit(PAGE);
    if (error) throw error;
    if (!data || data.length === 0) break;

    // Bulk update: do it in parallel with concurrency 25
    const CONC = 25;
    let i = 0;
    await Promise.all(
      Array.from({ length: CONC }, async () => {
        while (i < data.length) {
          const row = data[i++];
          const { error: upErr } = await supabase
            .from("products")
            .update({
              name: row.sku,
              description: null,
              specs: {},
            })
            .eq("id", row.id);
          if (upErr) console.error(`  ${row.sku}: ${upErr.message}`);
        }
      }),
    );
    processed += data.length;
    console.log(`  reset ${processed} products...`);
    if (data.length < PAGE) break;
  }

  // Step 2: clear images globally (works even on rows we didn't touch above)
  console.log("\nPhase 2/2: clearing images JSONB to '[]' globally...");
  const { error: imgErr } = await supabase
    .from("products")
    .update({ images: [] })
    .gte("created_at", "1970-01-01");
  if (imgErr) console.error("images clear:", imgErr.message);

  // Verify
  const { count: afterDesc } = await supabase
    .from("products")
    .select("*", { count: "exact", head: true })
    .not("description", "is", null);
  const { data: afterImg } = await supabase
    .from("products")
    .select("images")
    .neq("images", "[]")
    .limit(5);

  console.log("\n=== Result ===");
  console.log(`  products with description (after): ${afterDesc}`);
  console.log(
    `  products with non-empty images (after sample 5): ${afterImg?.length ?? 0}`,
  );

  // Show 3 sample products to confirm clean state
  const { data: samples } = await supabase
    .from("products")
    .select("sku, name, description, price, images, status")
    .eq("status", "active")
    .limit(3);
  console.log("\n=== Sample products (post-cleanup) ===");
  for (const p of samples ?? []) {
    console.log(
      `  sku=${p.sku}  name=${p.name}  price=€${p.price}  desc=${p.description}  imgs=${JSON.stringify(p.images)}`,
    );
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
