/**
 * Backfill categories.leaf_slug + categories.full_path.
 *
 *   leaf_slug:  for a slug "parent--leaf" we want "leaf";
 *               for a slug "foo" we want "foo".
 *   full_path:  walk up parent_id, collect leaf_slugs, join with "/".
 */

import { config } from "dotenv";
config({ path: ".env.local" });
config({ path: ".env" });
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

interface Row {
  id: string;
  slug: string;
  parent_id: string | null;
  leaf_slug?: string;
  full_path?: string;
}

function leafOf(slug: string): string {
  const idx = slug.lastIndexOf("--");
  return idx >= 0 ? slug.slice(idx + 2) : slug;
}

async function main(): Promise<void> {
  const { data, error } = await supabase
    .from("categories")
    .select("id, slug, parent_id");
  if (error) throw error;
  const rows = (data ?? []) as Row[];

  const byId = new Map<string, Row>();
  for (const r of rows) {
    r.leaf_slug = leafOf(r.slug);
    byId.set(r.id, r);
  }

  // Compute full_path with memoization
  const memo = new Map<string, string>();
  function pathOf(id: string): string {
    const cached = memo.get(id);
    if (cached) return cached;
    const r = byId.get(id);
    if (!r) return "";
    let path: string;
    if (!r.parent_id) {
      path = r.leaf_slug!;
    } else {
      path = `${pathOf(r.parent_id)}/${r.leaf_slug}`;
    }
    memo.set(id, path);
    return path;
  }
  for (const r of rows) r.full_path = pathOf(r.id);

  // Check for duplicate full_paths (shouldn't happen but verify)
  const pathCounts = new Map<string, number>();
  for (const r of rows)
    pathCounts.set(r.full_path!, (pathCounts.get(r.full_path!) ?? 0) + 1);
  const dupes = Array.from(pathCounts.entries()).filter(([, c]) => c > 1);
  if (dupes.length > 0) {
    console.log(`⚠ ${dupes.length} duplicate full_paths:`);
    for (const [path, count] of dupes.slice(0, 10))
      console.log(`  ${path}  (${count}×)`);
  }

  console.log(`\n→ writing ${rows.length} updates with concurrency 25…`);
  let success = 0;
  let failed = 0;
  let processed = 0;
  let cursor = 0;
  const t0 = Date.now();
  await Promise.all(
    Array.from({ length: 25 }, async () => {
      while (cursor < rows.length) {
        const i = cursor++;
        const r = rows[i];
        const { error: upErr } = await supabase
          .from("categories")
          .update({ leaf_slug: r.leaf_slug, full_path: r.full_path })
          .eq("id", r.id);
        if (upErr) {
          failed++;
          if (failed <= 5)
            console.error(`  ✗ ${r.id} (${r.full_path}): ${upErr.message}`);
        } else success++;
        processed++;
        if (processed % 200 === 0) {
          const rate = processed / ((Date.now() - t0) / 1000);
          console.log(
            `  ${processed}/${rows.length}  ✓ ${success}  ✗ ${failed}  |  ${rate.toFixed(1)}/s`,
          );
        }
      }
    }),
  );

  console.log("\n=== Done ===");
  console.log(
    `  ✓ ${success}, ✗ ${failed}, elapsed ${((Date.now() - t0) / 1000).toFixed(1)}s`,
  );

  // Sample
  console.log("\nSample paths:");
  const sample = rows.slice(0, 6);
  for (const r of sample) console.log(`  ${r.full_path}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
