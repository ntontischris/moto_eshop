import { Meilisearch } from "meilisearch";
import type { SearchHit, SearchFacets } from "./types";

const host = process.env.NEXT_PUBLIC_MEILI_HOST ?? "";
const apiKey = process.env.NEXT_PUBLIC_MEILI_SEARCH_KEY ?? "";

const client = new Meilisearch({ host, apiKey });

const HITS_PER_PAGE = 24;

export interface SearchProductsOptions {
  q: string;
  brand?: string;
  category?: string;
  priceMin?: number;
  priceMax?: number;
  sort?: string;
  page?: number;
}

export interface SearchProductsResult {
  hits: SearchHit[];
  totalHits: number;
  hitsPerPage: number;
  page: number;
  facets: SearchFacets | null;
}

function buildFilter(opts: SearchProductsOptions): string[] {
  const filters: string[] = [];
  if (opts.brand) filters.push(`brand_slug = "${opts.brand}"`);
  if (opts.category) filters.push(`category_slug = "${opts.category}"`);
  if (opts.priceMin != null) filters.push(`price >= ${opts.priceMin}`);
  if (opts.priceMax != null) filters.push(`price <= ${opts.priceMax}`);
  return filters;
}

function buildSort(sort?: string): string[] {
  const map: Record<string, string> = {
    price_asc: "price:asc",
    price_desc: "price:desc",
    rating: "rating:desc",
    newest: "created_at:desc",
    name_asc: "name:asc",
  };
  return sort && map[sort] ? [map[sort]] : [];
}

export async function searchProducts(
  opts: SearchProductsOptions,
): Promise<SearchProductsResult> {
  const page = Math.max(1, opts.page ?? 1);
  const filter = buildFilter(opts);
  const sort = buildSort(opts.sort);

  const result = await client.index("products").search<SearchHit>(opts.q, {
    hitsPerPage: HITS_PER_PAGE,
    page,
    filter: filter.length > 0 ? filter : undefined,
    sort: sort.length > 0 ? sort : undefined,
    facets: ["brand_slug", "category_slug", "certification", "rider_type"],
    attributesToHighlight: ["name", "brand", "description"],
    highlightPreTag:
      '<mark class="bg-yellow-100 text-yellow-900 rounded-sm px-0.5">',
    highlightPostTag: "</mark>",
    attributesToCrop: ["description"],
    cropLength: 60,
  });

  return {
    hits: result.hits,
    totalHits:
      (result as unknown as { totalHits?: number }).totalHits ??
      result.estimatedTotalHits ??
      0,
    hitsPerPage: HITS_PER_PAGE,
    page,
    facets: (result.facetDistribution as SearchFacets | undefined) ?? null,
  };
}
