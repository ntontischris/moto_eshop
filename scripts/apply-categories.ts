/**
 * Insert the scraped category tree into the categories table.
 *
 *   Reads:  data/categories-tree.json (produced by scrape-categories.ts)
 *   Writes: categories rows with parent_id wired up
 *
 *   Uniqueness: categories.slug has a UNIQUE constraint. If a slug occurs
 *   in two different paths (e.g. "aksesoyar" as L1 and as a deeper level
 *   under another branch), we prefix the slug with the parent slug.
 *   The original eshop URL still works because product URLs reference
 *   the leaf slug via products.category_id (resolved through the tree).
 */

import { config } from "dotenv";
config({ path: ".env.local" });
config({ path: ".env" });
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } },
);

interface CategoryNode {
  slug: string;
  url: string;
  path: string[];
  parentSlug: string | null;
  level: number;
  name: string | null;
  description: string | null;
  imageUrl: string | null;
  productCount: number | null;
  fetchError?: string;
}

const dryRun = process.argv.includes("--dry-run");

// Build a unique slug key from the URL path so two categories that happen
// to share a leaf slug don't collide.
function uniqueSlug(node: CategoryNode): string {
  if (node.path.length <= 1) return node.slug;
  // join the last 2 segments: parent/leaf — usually enough
  return node.path.slice(-2).join("--");
}

// pathKey is the canonical lookup ("a/b/c") used to find a node's parent
function pathKey(node: CategoryNode): string {
  return node.path.join("/");
}

async function main(): Promise<void> {
  const raw = JSON.parse(
    readFileSync("data/categories-tree.json", "utf8"),
  ) as CategoryNode[];

  // Drop entries with no name AND no level-1 status (useless)
  const usable = raw.filter((n) => n.name || n.level === 1);
  console.log(`→ ${raw.length} scraped categories, ${usable.length} usable`);

  // Sort by level so parents are created before children
  usable.sort(
    (a, b) =>
      a.level - b.level || a.path.join("/").localeCompare(b.path.join("/")),
  );

  // Insert level by level. Track: pathKey → DB id so children can look up parent.
  const idByPath = new Map<string, string>();
  let inserted = 0;
  const updated = 0;
  let skipped = 0;
  const slugCollisions: { slug: string; pathKeyA: string; pathKeyB: string }[] =
    [];

  for (const node of usable) {
    const pk = pathKey(node);
    // resolve parent id
    let parentId: string | null = null;
    if (node.parentSlug && node.level > 1) {
      const parentPk = node.path.slice(0, -1).join("/");
      const pid = idByPath.get(parentPk);
      if (!pid) {
        skipped++;
        continue;
      }
      parentId = pid;
    }

    const row = {
      slug: uniqueSlug(node),
      name: node.name ?? node.slug,
      description: node.description,
      image_url: node.imageUrl,
      parent_id: parentId,
      position: 0,
    };

    if (dryRun) {
      idByPath.set(pk, "fake-" + pk);
      inserted++;
      continue;
    }

    // Try insert by slug. If it conflicts, log and skip (the existing
    // record stays in place).
    const { data, error } = await supabase
      .from("categories")
      .upsert(row, { onConflict: "slug" })
      .select("id, slug")
      .single();
    if (error) {
      skipped++;
      if (skipped <= 5) console.error(`  ✗ ${pk}: ${error.message}`);
      continue;
    }
    idByPath.set(pk, data.id);
    inserted++;
    if (inserted % 100 === 0) console.log(`  ${inserted}/${usable.length}…`);
  }

  console.log("\n=== Result ===");
  console.log(`  ✓ written/upserted:    ${inserted}`);
  console.log(`  • skipped (no parent / error): ${skipped}`);

  if (slugCollisions.length > 0) {
    console.log("\n  slug collisions (first 5):");
    for (const c of slugCollisions.slice(0, 5))
      console.log(`    ${c.slug}: ${c.pathKeyA} vs ${c.pathKeyB}`);
  }

  if (!dryRun) {
    // Quick verification
    const { count } = await supabase
      .from("categories")
      .select("*", { count: "exact", head: true });
    console.log(`\n  categories table now has ${count} rows`);

    const { data: l1 } = await supabase
      .from("categories")
      .select("slug, name")
      .is("parent_id", null);
    console.log("\n  Level-1 categories in DB:");
    for (const c of l1 ?? []) {
      console.log(`    ${c.slug.padEnd(35)} → ${c.name}`);
    }
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
