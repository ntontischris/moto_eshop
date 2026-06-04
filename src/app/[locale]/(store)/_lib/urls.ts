/** Strip leading/trailing slashes so segments join cleanly. */
function trim(path: string): string {
  return path.replace(/^\/+/, "").replace(/\/+$/, "");
}

/**
 * Clean canonical category URL (ADR 0002): `/{full_path}`.
 * `fullPath` is the category's hierarchical `full_path` (roots: == slug).
 * Locale-agnostic — the i18n Link/redirect adds the locale prefix.
 */
export function categoryPath(fullPath: string): string {
  return `/${trim(fullPath)}`;
}

/**
 * Clean canonical product URL (ADR 0002): `/{category_full_path}/{slug}`.
 * When the category path is unknown, fall back to `/{slug}`; the catch-all
 * then 301-redirects it to the canonical path.
 */
export function productPath(
  categoryFullPath: string | null | undefined,
  slug: string,
): string {
  const cat = categoryFullPath ? trim(categoryFullPath) : "";
  return cat ? `/${cat}/${slug}` : `/${slug}`;
}
