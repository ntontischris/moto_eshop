import { categoryPath, productPath } from "@/app/[locale]/(store)/_lib/urls";

/**
 * Resolve a legacy prefixed alias (`/product/{slug}` or `/category/{slug}`) to
 * its canonical clean path (without locale prefix), or null if it can't be
 * resolved. Used by the middleware to emit a real HTTP 308 — route components
 * can't under Cache Components (see ADR 0002 + the alias-redirect note).
 *
 * Reads via the Supabase REST API with the service-role key (server-only env),
 * since the middleware can't use the cached server query layer. On any failure
 * it returns null so the caller falls through to the route-level redirector.
 */
export async function resolveAliasTarget(
  kind: "product" | "category",
  slug: string,
): Promise<string | null> {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!base || !key) return null;

  const headers = { apikey: key, Authorization: `Bearer ${key}` };
  const s = encodeURIComponent(slug);

  try {
    if (kind === "category") {
      const res = await fetch(
        `${base}/rest/v1/categories?slug=eq.${s}&select=full_path&limit=1`,
        { headers, cache: "no-store" },
      );
      if (!res.ok) return null;
      const rows = (await res.json()) as { full_path: string | null }[];
      const fullPath = rows[0]?.full_path;
      return fullPath ? categoryPath(fullPath) : null;
    }

    const res = await fetch(
      `${base}/rest/v1/products?slug=eq.${s}&status=eq.active&select=slug,categories(full_path)&limit=1`,
      { headers, cache: "no-store" },
    );
    if (!res.ok) return null;
    const rows = (await res.json()) as {
      slug: string;
      categories: { full_path: string | null } | null;
    }[];
    const row = rows[0];
    if (!row) return null;
    return productPath(row.categories?.full_path ?? null, row.slug);
  } catch {
    return null;
  }
}
