import { tool } from "ai";
import { z } from "zod/v4";
import { searchProducts as meiliSearch } from "@/lib/meilisearch/search-query";
import { createClient } from "@/lib/supabase/server";
import { primaryImageUrl } from "@/lib/queries/product-images";

export const searchProductsInputSchema = z.object({
  query: z
    .string()
    .min(1)
    .describe("Natural-language search query, e.g. 'κράνος touring μαύρο'"),
  filters: z
    .object({
      brand: z.string().optional(),
      category: z.string().optional(),
      priceMin: z.number().nonnegative().optional(),
      priceMax: z.number().nonnegative().optional(),
    })
    .optional(),
  limit: z.number().int().positive().max(12).optional(),
});

export type SearchProductsInput = z.infer<typeof searchProductsInputSchema>;

export interface SearchProductsHit {
  id: string;
  slug: string;
  name: string;
  brand: string;
  price: number;
  image: string | null;
  in_stock: boolean;
}

export interface SearchProductsResult {
  hits: SearchProductsHit[];
  totalHits: number;
}

/**
 * Fallback that hits the products table directly with ILIKE when Meilisearch
 * returns nothing — either because the index is empty/disconnected (typical in
 * local dev) or because Meili had a temporary outage.
 *
 * Cheap recall via per-word ILIKE OR. Brand/category filters are skipped
 * because Meili uses slugs while products store UUID FKs; converting requires
 * an extra join that isn't worth it for a fallback path.
 */
async function supabaseFallback(
  input: SearchProductsInput,
): Promise<SearchProductsResult> {
  const supabase = await createClient();
  const limit = Math.min(input.limit ?? 6, 12);

  type Row = {
    id: string;
    slug: string;
    name: string;
    price: number;
    images: unknown;
    images_cdn: unknown;
    stock: number | null;
    brands: { name: string } | null;
  };

  // Greek-friendly: split into words, ILIKE OR on each. Avoids requiring the
  // exact phrase to match the indexed product name.
  const words = input.query
    .split(/\s+/)
    .map((w) => w.replace(/[%,()'"]/g, "").trim())
    .filter((w) => w.length >= 3);

  // Build query — cast the client to bypass database.types not knowing all rows
  // (project standard escape; same pattern as get-product-details / compare).
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let q: any = supabase
    .from("products")
    .select(
      "id, slug, name, price, images, images_cdn, stock, brands(name)",
    ) as never as Record<string, unknown>;

  // status = 'active' to mirror what the storefront shows
  q = q.eq("status", "active");

  if (words.length > 0) {
    const orClause = words.map((w) => `name.ilike.%${w}%`).join(",");
    q = q.or(orClause);
  }
  if (input.filters?.priceMin !== undefined) {
    q = q.gte("price", input.filters.priceMin);
  }
  if (input.filters?.priceMax !== undefined && input.filters.priceMax > 0) {
    q = q.lte("price", input.filters.priceMax);
  }

  q = q.limit(limit);

  const resp = (await q) as { data: Row[] | null; error: unknown };
  const rows = Array.isArray(resp.data) ? resp.data : [];

  return {
    hits: rows.map((r) => ({
      id: r.id,
      slug: r.slug,
      name: r.name,
      brand: r.brands?.name ?? "",
      price: r.price,
      image: primaryImageUrl(r.images, r.images_cdn),
      in_stock: (r.stock ?? 0) > 0,
    })),
    totalHits: rows.length,
  };
}

export const searchProductsTool = tool({
  description:
    "Search the product catalog. Returns up to 12 product hits with id, slug, name, brand, price, image, and stock status. Use this when the user wants to find products by description, category, or brand.",
  inputSchema: searchProductsInputSchema,
  execute: async (input): Promise<SearchProductsResult> => {
    const { query, filters, limit } = input;

    // Primary: Meilisearch (semantic + facets)
    let meiliFailed = false;
    let meiliHits: Awaited<ReturnType<typeof meiliSearch>>["hits"] = [];
    let meiliTotal = 0;
    try {
      const raw = await meiliSearch({
        q: query,
        brand: filters?.brand,
        category: filters?.category,
        priceMin: filters?.priceMin,
        priceMax: filters?.priceMax,
        page: 1,
      });
      meiliHits = raw.hits;
      meiliTotal = raw.totalHits;
    } catch {
      meiliFailed = true;
    }

    // Fallback when Meili has no host configured, returned 0, or threw.
    if (meiliFailed || meiliHits.length === 0) {
      const fallback = await supabaseFallback(input);
      if (fallback.hits.length > 0) return fallback;
      // Both empty → return empty Meili shape so the model can apologise.
      return { hits: [], totalHits: 0 };
    }

    const capped = meiliHits.slice(0, Math.min(limit ?? 6, 12));
    return {
      hits: capped.map((h) => ({
        id: String(h.id),
        slug: h.slug,
        name: h.name,
        brand: h.brand,
        price: h.price,
        image: (h as { image_url?: string | null }).image_url ?? null,
        in_stock: ((h as { stock?: number }).stock ?? 0) > 0,
      })),
      totalHits: meiliTotal,
    };
  },
});
