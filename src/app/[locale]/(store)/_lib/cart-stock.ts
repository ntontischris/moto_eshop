"use server";

import { buildSizeVariants, type SizeVariant } from "./size-availability";

async function resolveProductId(slug: string): Promise<string | null> {
  const { createAdminClient } = await import("@/lib/supabase/admin");
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("products")
    .select("id")
    .eq("slug", slug)
    .eq("status", "active")
    .maybeSingle();
  return data?.id ?? null;
}

/**
 * Server-authoritative per-size stock check (ADR 0001).
 *
 * The live storefront cart is localStorage, so a stale page is the oversell
 * risk this guards: at add/change time we re-read `v_product_available_stock`
 * for the exact (product, [Size code]) and reject an out-of-stock size no
 * matter what the client believed. Fails closed (reject) on a read error or an
 * unknown size, so a blip or a stale code can never oversell.
 */
export async function checkSizeAvailable(
  productId: string,
  sizeCode: string,
): Promise<{ ok: boolean }> {
  const { createAdminClient } = await import("@/lib/supabase/admin");
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("v_product_available_stock")
    .select("size, available")
    .eq("product_id", productId)
    .eq("size", sizeCode);
  if (error || !data) return { ok: false };
  const variant = buildSizeVariants(data).find((v) => v.code === sizeCode);
  return { ok: variant != null && variant.state !== "out" };
}

/**
 * The product's [Size variant]s by slug, for the in-cart size selector. The
 * cart line carries only the slug, so we resolve slug → product id, then read
 * the same fresh per-size availability the PDP uses. Returns `[]` for an
 * unknown slug or a no-variant product.
 */
export async function getProductSizesBySlug(
  slug: string,
): Promise<SizeVariant[]> {
  const productId = await resolveProductId(slug);
  if (!productId) return [];
  const { createAdminClient } = await import("@/lib/supabase/admin");
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("v_product_available_stock")
    .select("size, available")
    .eq("product_id", productId);
  if (error || !data) return [];
  return buildSizeVariants(data);
}

/**
 * Slug-based per-size stock check for the in-cart size change. Resolves
 * slug → id then re-validates against `v_product_available_stock`; fails closed
 * (reject) on an unknown slug or a read error.
 */
export async function checkSizeAvailableBySlug(
  slug: string,
  sizeCode: string,
): Promise<{ ok: boolean }> {
  const productId = await resolveProductId(slug);
  if (!productId) return { ok: false };
  return checkSizeAvailable(productId, sizeCode);
}
