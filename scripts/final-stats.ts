import { config } from "dotenv";
config({ path: ".env.local" });
config({ path: ".env" });
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

function productCountQuery() {
  return supabase.from("products").select("*", { count: "exact", head: true });
}
type CountQuery = ReturnType<typeof productCountQuery>;

async function ct(
  filter: (q: CountQuery) => CountQuery,
  label: string,
): Promise<void> {
  const { count, error } = await filter(productCountQuery());
  console.log(
    `  ${label.padEnd(50)} ${error ? "ERR" : (count ?? 0).toString().padStart(7)}`,
  );
}

async function main(): Promise<void> {
  console.log("\n=== PRODUCT CONTENT ENRICHMENT ===\n");
  await ct((q) => q, "Total products");
  await ct((q) => q.eq("status", "active"), "Active (publishable)");
  await ct((q) => q.not("description", "is", null), "With description");
  await ct((q) => q.gt("price", 0), "With price > 0");
  await ct(
    (q) =>
      q
        .not("description", "is", null)
        .not("name", "ilike", "%000%")
        .eq("status", "active"),
    "Ready-for-storefront (name + desc + active)",
  );

  // Image counts — paginate to bypass Supabase default 1000-row cap
  let withImagesCount = 0;
  let totalImages = 0;
  let from = 0;
  const PAGE = 1000;
  while (true) {
    const { data, error } = await supabase
      .from("products")
      .select("images")
      .range(from, from + PAGE - 1);
    if (error) {
      console.error("paginated query error:", error.message);
      break;
    }
    if (!data || data.length === 0) break;
    for (const r of data) {
      const n = Array.isArray(r.images) ? r.images.length : 0;
      if (n > 0) withImagesCount++;
      totalImages += n;
    }
    if (data.length < PAGE) break;
    from += PAGE;
  }
  console.log(
    `  ${"With ≥1 image".padEnd(50)} ${withImagesCount.toString().padStart(7)}`,
  );
  console.log(
    `  ${"Total image URLs collected".padEnd(50)} ${totalImages.toString().padStart(7)}`,
  );

  // Brands count
  const { count: brandCount } = await supabase
    .from("brands")
    .select("*", { count: "exact", head: true });
  console.log(`\n  brands:                   ${brandCount}`);

  // Top products by image count — query directly
  const { data: topByImg } = await supabase
    .from("products")
    .select("sku, name, images")
    .not("images", "eq", "[]")
    .limit(2000);
  const topSorted = (topByImg ?? [])
    .map((p) => ({
      sku: p.sku as string,
      name: (p.name ?? "") as string,
      n: Array.isArray(p.images) ? p.images.length : 0,
    }))
    .sort((a, b) => b.n - a.n)
    .slice(0, 8);
  console.log("\n  Products with most images:");
  for (const p of topSorted) {
    console.log(
      `    ${p.n.toString().padStart(2)} imgs  ${p.sku.padEnd(20)} ${p.name.slice(0, 55)}`,
    );
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
