import type { Locale } from "@/i18n/config";
import { getProduct } from "@/lib/queries/products";
import { productPath } from "../../_lib/urls";

/** Canonical clean path for a product slug, or null if it doesn't exist. */
export async function productRedirectTarget(
  slug: string,
  locale: Locale,
): Promise<string | null> {
  const product = await getProduct(slug, locale);
  if (!product) return null;
  return productPath(product.category_path, product.slug);
}
