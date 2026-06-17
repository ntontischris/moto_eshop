import { cacheTag, cacheLife } from "next/cache";
import { getCategoryByPath } from "@/lib/queries/categories";

/**
 * Resolution of a clean catch-all path into a product, a category, or a miss.
 *
 *   /eksoplismos/endysh/mpoyfan             → category listing
 *   /eksoplismos/endysh/mpoyfan/abudisloc30 → product page
 */
export type Resolved =
  | {
      kind: "product";
      productId: string;
      productSlug: string;
      canonicalPath: string[];
    }
  | {
      kind: "category";
      categoryId: string;
      categorySlug: string;
      fullPath: string;
    }
  | { kind: "not_found" };

/**
 * Cached path resolution backed by the cookie-free admin client, so the
 * catch-all route serving every PDP/PLP is not forced dynamic and the lookup
 * is shared between generateMetadata and the page render. Mirrors the caching
 * convention of getProduct / getCategoryByPath.
 */
export async function resolvePath(segments: string[]): Promise<Resolved> {
  "use cache";
  if (segments.length === 0) return { kind: "not_found" };

  // ── 1. last segment as product slug ────────────────────────────────
  const last = segments[segments.length - 1];
  cacheTag("products");
  cacheTag(`slug:${last}`);
  cacheLife("hours");

  const { createAdminClient } = await import("@/lib/supabase/admin");
  const supabase = createAdminClient();
  const { data: productHit, error } = await supabase
    .from("products")
    .select("id, slug, category_id, categories(full_path)")
    .eq("slug", last)
    .eq("status", "active")
    .maybeSingle();

  // A transient Supabase error must NOT be cached as a permanent miss.
  if (error) throw new Error(`resolvePath(${last}): ${error.message}`);

  if (productHit) {
    const cat = productHit.categories as unknown as {
      full_path: string | null;
    } | null;
    const canonicalParent = cat?.full_path ?? "";
    const canonicalPath = canonicalParent
      ? [...canonicalParent.split("/"), productHit.slug]
      : [productHit.slug];

    return {
      kind: "product",
      productId: productHit.id,
      productSlug: productHit.slug,
      canonicalPath,
    };
  }

  // ── 2. full path as category ───────────────────────────────────────
  const fullPath = segments.join("/");
  const category = await getCategoryByPath(fullPath);
  if (category) {
    return {
      kind: "category",
      categoryId: category.id,
      categorySlug: category.slug,
      fullPath,
    };
  }

  return { kind: "not_found" };
}
