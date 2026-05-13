import { config } from "dotenv";
config({ path: ".env.local" });
config({ path: ".env" });
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

async function main(): Promise<void> {
  const slug = process.argv[2] ?? "air000kra472";

  // Same query as getProduct() in lib/queries/products.ts
  const { data, error } = await supabase
    .from("products")
    .select(
      `
      id, slug, name, description, price, compare_at_price, status,
      sku, stock, certification, rider_type, specs, images,
      view_count, average_rating, review_count, created_at,
      brands ( name, slug ),
      categories ( slug, name )
    `,
    )
    .eq("slug", slug)
    .eq("status", "active")
    .single();

  console.log(`\nQuerying slug = "${slug}" with status = "active"\n`);

  if (error) {
    console.error("ERROR:", error.message);
    console.error("Code:", error.code);
    console.error("Hint:", error.hint);
    console.error("Details:", error.details);
  }

  if (data) {
    console.log("✓ FOUND:");
    console.log("  id:          ", data.id);
    console.log("  slug:        ", data.slug);
    console.log("  name:        ", data.name);
    console.log("  status:      ", data.status);
    console.log("  price:       ", data.price);
    console.log(
      "  has desc:    ",
      !!data.description,
      `(${data.description?.length ?? 0} chars)`,
    );
    console.log("  brand:       ", JSON.stringify(data.brands));
    console.log("  category:    ", JSON.stringify(data.categories));
    console.log(
      "  images type: ",
      Array.isArray(data.images)
        ? `array[${data.images.length}]`
        : typeof data.images,
    );
    if (Array.isArray(data.images) && data.images.length > 0) {
      console.log("  images[0]:   ", JSON.stringify(data.images[0]));
    }
  } else {
    console.log("✗ NOT FOUND with status=active");
    // try without status filter
    const { data: anyStatus } = await supabase
      .from("products")
      .select("id, slug, status, name")
      .eq("slug", slug)
      .single();
    if (anyStatus) {
      console.log("\nBUT exists with status =", anyStatus.status);
      console.log("  id:   ", anyStatus.id);
      console.log("  name: ", anyStatus.name);
    } else {
      console.log("Slug not found at all.");
    }
  }

  // Statuses count overall
  console.log("\n=== Status distribution ===");
  for (const s of ["active", "draft", "archived"]) {
    const { count } = await supabase
      .from("products")
      .select("*", { count: "exact", head: true })
      .eq("status", s);
    console.log(`  ${s.padEnd(10)} ${count}`);
  }
}

main().catch(console.error);
