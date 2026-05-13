/**
 * Sanity-check the product → category mapping.
 *
 *   1. How many products are in each L1 category?
 *   2. Take 3 sample products per L1 and print: brand, name, full category path
 *   3. Flag suspicious mismatches (e.g. lubricant under "Helmets")
 */

import { config } from "dotenv";
config({ path: ".env.local" });
config({ path: ".env" });
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

async function main(): Promise<void> {
  // Categories: id → { slug, name, parent_id }
  const { data: catRows } = await supabase
    .from("categories")
    .select("id, slug, name, parent_id");
  const catById = new Map<
    string,
    { slug: string; name: string; parent_id: string | null }
  >();
  for (const c of catRows ?? []) catById.set(c.id, c);

  function pathOf(id: string): string[] {
    const out: string[] = [];
    let cur: string | null = id;
    let depth = 0;
    while (cur && depth < 6) {
      const c = catById.get(cur);
      if (!c) break;
      out.unshift(c.name);
      cur = c.parent_id;
      depth++;
    }
    return out;
  }

  function l1Of(id: string): { id: string; name: string } | null {
    let cur: string | null = id;
    let depth = 0;
    while (cur && depth < 6) {
      const c = catById.get(cur);
      if (!c) return null;
      if (c.parent_id === null) return { id: cur, name: c.name };
      cur = c.parent_id;
      depth++;
    }
    return null;
  }

  // Group product counts by L1
  console.log("→ counting products per L1…\n");
  const l1Cats = (catRows ?? []).filter((c) => c.parent_id === null);
  const totalLinked: number[] = [];
  for (const l1 of l1Cats) {
    // descendant ids
    const descendants = new Set<string>([l1.id]);
    let frontier = [l1.id];
    while (frontier.length > 0) {
      const next: string[] = [];
      for (const c of catRows ?? []) {
        if (
          c.parent_id &&
          descendants.has(c.parent_id) &&
          !descendants.has(c.id)
        ) {
          descendants.add(c.id);
          next.push(c.id);
        }
      }
      frontier = next;
    }
    const { count } = await supabase
      .from("products")
      .select("*", { count: "exact", head: true })
      .in("category_id", Array.from(descendants))
      .eq("status", "active");
    console.log(
      `  ${l1.name.padEnd(30)} ${(count ?? 0).toString().padStart(6)} products`,
    );
    totalLinked.push(count ?? 0);
  }
  console.log(
    `  ${"TOTAL".padEnd(30)} ${totalLinked
      .reduce((a, b) => a + b, 0)
      .toString()
      .padStart(6)}`,
  );

  // Sample per L1
  console.log("\n→ 5 random products per L1 (sanity check):");
  for (const l1 of l1Cats) {
    const descendants = new Set<string>([l1.id]);
    let frontier = [l1.id];
    while (frontier.length > 0) {
      const next: string[] = [];
      for (const c of catRows ?? []) {
        if (
          c.parent_id &&
          descendants.has(c.parent_id) &&
          !descendants.has(c.id)
        ) {
          descendants.add(c.id);
          next.push(c.id);
        }
      }
      frontier = next;
    }
    const { data: sample } = await supabase
      .from("products")
      .select("sku, name, brands(name), category_id")
      .in("category_id", Array.from(descendants))
      .eq("status", "active")
      .limit(5);
    if (!sample || sample.length === 0) continue;
    console.log(`\n  ─── ${l1.name} ───`);
    for (const p of sample) {
      const brand =
        (p.brands as unknown as { name: string } | null)?.name ?? "?";
      const pathStr = pathOf(p.category_id as string).join(" → ");
      console.log(`    [${brand}] ${p.name?.slice(0, 50)}`);
      console.log(`         path: ${pathStr}`);
    }
  }

  // Suspicious mismatches: look for known patterns
  console.log("\n→ Looking for suspicious cross-category items…");
  const suspects: { sku: string; name: string; brand: string; path: string }[] =
    [];
  // helmets in non-helmet categories: name contains "Κράνος" but L1 is not Εξοπλισμός αναβάτη
  const { data: helmetMaybe } = await supabase
    .from("products")
    .select("sku, name, brands(name), category_id")
    .ilike("name", "%Κράνος%")
    .eq("status", "active")
    .limit(50);
  for (const p of helmetMaybe ?? []) {
    if (!p.category_id) continue;
    const l1 = l1Of(p.category_id as string);
    if (l1 && l1.name.includes("μοτοσικλέτας")) {
      const brand =
        (p.brands as unknown as { name: string } | null)?.name ?? "?";
      suspects.push({
        sku: p.sku,
        name: p.name ?? "",
        brand,
        path: pathOf(p.category_id as string).join(" → "),
      });
    }
  }
  console.log(
    `  Potential helmets in 'motorcycle equipment' (sample 50 helmets): ${suspects.length}`,
  );
  for (const s of suspects.slice(0, 8))
    console.log(
      `    [${s.brand}] ${s.sku} ${s.name.slice(0, 50)}\n      → ${s.path}`,
    );
}

main().catch(console.error);
