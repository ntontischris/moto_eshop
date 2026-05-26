import { createAdminClient } from "@/lib/supabase/admin";

export interface CatalogContext {
  categories: { name: string; slug: string }[];
  brands: { name: string; slug: string }[];
}

/**
 * Real category/brand slugs handed to the AI so it can build productRail blocks
 * with `source: { mode: "auto", by, value }` that actually resolve — instead of
 * inventing slugs or needing a live catalog tool loop.
 */
export async function buildCatalogContext(): Promise<CatalogContext> {
  const supabase = createAdminClient();
  const [{ data: cats }, { data: brs }] = await Promise.all([
    supabase.from("categories").select("name, slug").order("name").limit(80),
    supabase.from("brands").select("name, slug").order("name").limit(80),
  ]);
  return {
    categories: (cats ?? []).map((c) => ({ name: c.name, slug: c.slug })),
    brands: (brs ?? []).map((b) => ({ name: b.name, slug: b.slug })),
  };
}
