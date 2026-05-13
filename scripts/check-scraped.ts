import { config } from "dotenv";
config({ path: ".env.local" });
config({ path: ".env" });
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

async function main(): Promise<void> {
  const { data } = await supabase
    .from("products")
    .select("sku, name, description, images, specs")
    .neq("name", "")
    .not("description", "is", null)
    .limit(3);

  for (const p of data ?? []) {
    console.log("\n" + "=".repeat(70));
    console.log("SKU:        " + p.sku);
    console.log("NAME:       " + p.name);
    console.log(
      "DESCRIPTION (first 250 chars):\n  " +
        (p.description ?? "(none)").replace(/\n/g, "\n  ").slice(0, 250) +
        "…",
    );
    console.log("IMAGES (" + (p.images?.length ?? 0) + "):");
    for (const img of (p.images ?? []).slice(0, 3)) console.log("  " + img);
    if (p.specs?.overview) {
      console.log(
        "SPECS (first 200 chars):\n  " + p.specs.overview.slice(0, 200) + "…",
      );
    }
  }

  const { count: namedCount } = await supabase
    .from("products")
    .select("*", { count: "exact", head: true })
    .not("description", "is", null);
  console.log("\n" + "=".repeat(70));
  console.log(`Total products with description: ${namedCount}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
