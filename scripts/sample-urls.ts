import { config } from "dotenv";
config({ path: ".env.local" });
config({ path: ".env" });
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

async function main(): Promise<void> {
  // Find products with: active + name (not placeholder) + description + images
  const { data: best } = await supabase
    .from("products")
    .select("sku, slug, name, brand_id, images")
    .eq("status", "active")
    .not("description", "is", null)
    .not("images", "eq", "[]")
    .limit(10);

  console.log("=== Products WITH IMAGES (best candidates) ===\n");
  for (const p of best ?? []) {
    const url = `http://localhost:3000/p/${p.slug}`; // any category works since slug is unique
    console.log(`  SKU:  ${p.sku}`);
    console.log(`  NAME: ${p.name?.slice(0, 70)}`);
    console.log(`  SLUG: ${p.slug}`);
    console.log(`  URL:  http://localhost:3000/eksoplismos-anabath/${p.slug}`);
    console.log("");
  }

  // Also find well-described products (with or without images)
  const { data: described } = await supabase
    .from("products")
    .select("sku, slug, name")
    .eq("status", "active")
    .not("description", "is", null)
    .ilike("name", "Κράνος%")
    .limit(5);

  console.log("\n=== Sample helmets (with descriptions) ===\n");
  for (const p of described ?? []) {
    console.log(`  ${p.sku.padEnd(20)} ${p.name?.slice(0, 60)}`);
    console.log(`    http://localhost:3000/kranea/${p.slug}`);
  }
}

main().catch(console.error);
