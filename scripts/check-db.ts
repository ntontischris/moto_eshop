/**
 * Quick read-only counts across the synced tables to verify state.
 * Run: pnpm tsx scripts/check-db.ts
 */
import { config } from "dotenv";
config({ path: ".env.local" });
config({ path: ".env" });
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } },
);

async function count(table: string): Promise<number> {
  const { count, error } = await supabase
    .from(table)
    .select("*", { count: "exact", head: true });
  if (error) {
    console.log(`  ${table.padEnd(28)} ERR  ${error.message}`);
    return -1;
  }
  return count ?? 0;
}

async function main(): Promise<void> {
  const tables = [
    "brands",
    "categories",
    "products",
    "product_translations",
    "product_compatibility",
    "warehouses",
    "product_stock_locations",
    "stock_reservations",
    "erp_customers",
    "erp_customer_sites",
    "erp_sync_log",
    "carts",
    "cart_items",
    "orders",
    "order_items",
    "user_profiles",
    "bikes",
  ];

  console.log("\nDB counts (motomartet)\n" + "=".repeat(40));
  for (const t of tables) {
    const c = await count(t);
    console.log(
      `  ${t.padEnd(28)} ${c >= 0 ? c.toString().padStart(8) : "ERR"}`,
    );
  }

  // Show a real product to check erp_id alignment
  const { data: sample } = await supabase
    .from("products")
    .select("erp_id, sku, name, price, brand_id")
    .limit(3);
  if (sample && sample.length) {
    console.log("\nSample products:");
    sample.forEach((p) =>
      console.log(
        `  erp_id=${p.erp_id?.slice(0, 8)}... sku=${p.sku.padEnd(20)} price=€${p.price}`,
      ),
    );
  }

  // Latest sync log entries
  const { data: logs } = await supabase
    .from("erp_sync_log")
    .select("entity, status, records_in, records_out, started_at, error")
    .order("started_at", { ascending: false })
    .limit(8);
  if (logs && logs.length) {
    console.log("\nLast sync runs:");
    for (const l of logs) {
      console.log(
        `  ${l.entity.padEnd(15)} ${l.status.padEnd(10)} in=${(l.records_in ?? "-").toString().padStart(6)} out=${(l.records_out ?? "-").toString().padStart(6)} ${l.error ? "err=" + l.error.slice(0, 60) : ""}`,
      );
    }
  }
}

main().catch(console.error);
