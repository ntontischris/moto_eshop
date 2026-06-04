import { Meilisearch } from "meilisearch";
import {
  searchProducts as searchProductsInSupabase,
  type ProductListItem,
} from "@/lib/queries/products";
import type { SearchHit, SearchFacets } from "./types";

// Lazy-init: Meilisearch ctor throws on empty/invalid host. Defer until used.
let _client: Meilisearch | null = null;
function getClient(): Meilisearch | null {
  if (_client) return _client;
  const host = process.env.NEXT_PUBLIC_MEILI_HOST;
  if (!host) return null;
  _client = new Meilisearch({
    host,
    apiKey: process.env.NEXT_PUBLIC_MEILI_SEARCH_KEY ?? "",
  });
  return _client;
}

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

// Shape a Supabase catalog row into the Meili hit contract consumers expect.
// Meili-only fields (facets, highlights, full-text metadata) have no Supabase
// equivalent, so they default to empty rather than fabricate values.
function toSearchHit(p: ProductListItem): SearchHit {
  return {
    id: p.id,
    slug: p.slug,
    name: p.name,
    brand: p.brand,
    brand_slug: p.brand_slug,
    category_name: "",
    category_slug: p.category_slug,
    description: "",
    sku: "",
    price: p.price,
    compare_at_price: p.compare_at_price,
    rating: p.average_rating,
    review_count: p.review_count,
    in_stock: p.stock > 0,
    stock: p.stock,
    certification: p.certification,
    rider_type: p.rider_type,
    primary_image_url: p.primary_image_url,
    primary_image_alt: p.primary_image_alt,
    created_at: "",
    updated_at: "",
  };
}

// Fallback so search never silently returns empty when Meili is absent (no host
// configured — the production reality) or down. Reuses the Supabase catalog
// search; facets/highlights are unavailable on this path.
async function fallbackToSupabase(
  opts: SearchProductsOptions,
  page: number,
): Promise<SearchProductsResult> {
  const result = await searchProductsInSupabase(opts.q, page, HITS_PER_PAGE);
  return {
    hits: result.data.map(toSearchHit),
    totalHits: result.total,
    hitsPerPage: HITS_PER_PAGE,
    page,
    facets: null,
  };
}

export async function searchProducts(
  opts: SearchProductsOptions,
): Promise<SearchProductsResult> {
  const page = Math.max(1, opts.page ?? 1);
  const filter = buildFilter(opts);
  const sort = buildSort(opts.sort);

  const client = getClient();
  if (client) {
    try {
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

      if (result.hits.length > 0) {
        return {
          hits: result.hits,
          totalHits:
            (result as unknown as { totalHits?: number }).totalHits ??
            result.estimatedTotalHits ??
            0,
          hitsPerPage: HITS_PER_PAGE,
          page,
          facets:
            (result.facetDistribution as SearchFacets | undefined) ?? null,
        };
      }
    } catch {
      // Meili down/misconfigured — fall through to the Supabase fallback.
    }
  }

  return fallbackToSupabase(opts, page);
}
