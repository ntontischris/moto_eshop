import { config } from "dotenv";
config({ path: ".env.local" });
config({ path: ".env" });
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

async function main(): Promise<void> {
  // Sample L3 paths
  const { data } = await supabase
    .from("categories")
    .select("name, full_path, leaf_slug")
    .like("full_path", "eksoplismos-anabath/%/%")
    .limit(8);
  console.log("L3 sample paths under Εξοπλισμός αναβάτη:");
  for (const c of data ?? [])
    console.log(`  ${c.full_path.padEnd(70)} → ${c.name}`);
}

main().catch(console.error);
