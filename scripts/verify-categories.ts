import { config } from "dotenv";
config({ path: ".env.local" });
config({ path: ".env" });
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

async function main(): Promise<void> {
  const { count } = await supabase
    .from("categories")
    .select("*", { count: "exact", head: true });
  console.log(`Total categories: ${count}`);

  const { data: l1 } = await supabase
    .from("categories")
    .select("id, slug, name")
    .is("parent_id", null)
    .order("name");
  console.log(`\nLevel 1 (${l1?.length ?? 0}):`);
  for (const c of l1 ?? []) {
    const { count: childCount } = await supabase
      .from("categories")
      .select("*", { count: "exact", head: true })
      .eq("parent_id", c.id);
    console.log(
      `  ${c.slug.padEnd(35)} → ${c.name?.padEnd(30)} [${childCount} children]`,
    );
  }
}

main().catch(console.error);
