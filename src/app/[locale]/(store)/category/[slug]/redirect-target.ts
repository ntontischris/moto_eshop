import type { Locale } from "@/i18n/config";
import { getCategory } from "@/lib/queries/categories";
import { categoryPath } from "../../_lib/urls";

/** Canonical clean path for a category slug, or null if it doesn't exist. */
export async function categoryRedirectTarget(
  slug: string,
  locale: Locale,
): Promise<string | null> {
  const cat = await getCategory(slug, locale);
  if (!cat?.full_path) return null;
  return categoryPath(cat.full_path);
}
