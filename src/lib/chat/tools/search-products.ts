import { tool } from "ai";
import { z } from "zod/v4";
import { searchProducts as meiliSearch } from "@/lib/meilisearch/search-query";

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

export const searchProductsTool = tool({
  description:
    "Search the product catalog. Returns up to 12 product hits with id, slug, name, brand, price, image, and stock status. Use this when the user wants to find products by description, category, or brand.",
  inputSchema: searchProductsInputSchema,
  execute: async ({ query, filters, limit }): Promise<SearchProductsResult> => {
    const raw = await meiliSearch({
      q: query,
      brand: filters?.brand,
      category: filters?.category,
      priceMin: filters?.priceMin,
      priceMax: filters?.priceMax,
      page: 1,
    });
    const capped = raw.hits.slice(0, Math.min(limit ?? 6, 12));
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
      totalHits: raw.totalHits,
    };
  },
});
