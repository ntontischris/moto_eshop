"use server";

import { buildSizeVariants, type SizeVariant } from "./size-availability";

/**
 * The product's [Size variant]s by slug, for the in-cart size selector. The
 * cart line carries only the slug, so we resolve slug → product id, then read
 * the same fresh per-size availability the PDP uses. Returns `[]` for an
 * unknown slug or a no-variant product. (The actual stock validation on a size
 * change happens server-side in the cart `changeItemSize` action.)
 */
export async function getProductSizesBySlug(
  slug: string,
): Promise<SizeVariant[]> {
  const { createAdminClient } = await import("@/lib/supabase/admin");
  const supabase = createAdminClient();
  const { data: product } = await supabase
    .from("products")
    .select("id")
    .eq("slug", slug)
    .eq("status", "active")
    .maybeSingle();
  if (!product) return [];

  const { data, error } = await supabase
    .from("v_product_available_stock")
    .select("size, available")
    .eq("product_id", product.id);
  if (error || !data) return [];
  return buildSizeVariants(data);
}
