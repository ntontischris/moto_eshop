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
    .from("categories")
    .select("id, slug, name, parent_id");
  if (!data) return;

  const byId = new Map<string, (typeof data)[number]>();
  for (const c of data) byId.set(c.id, c);

  const childrenOf = new Map<string | null, (typeof data)[number][]>();
  for (const c of data) {
    const arr = childrenOf.get(c.parent_id) ?? [];
    arr.push(c);
    childrenOf.set(c.parent_id, arr);
  }

  const l1 = childrenOf.get(null) ?? [];
  console.log("\nL1 → L2 → L3 sample (first L1):");
  for (const a of l1) {
    const l2 = childrenOf.get(a.id) ?? [];
    console.log(`\n${a.name}  (${l2.length} L2 children)`);
    for (const b of l2.slice(0, 4)) {
      const l3 = childrenOf.get(b.id) ?? [];
      console.log(`  └─ ${b.name}  (${l3.length} L3 children)`);
      for (const c of l3.slice(0, 3)) console.log(`       └─ ${c.name}`);
    }
  }
}

main().catch(console.error);
