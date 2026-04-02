"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  searchProducts,
  type SearchProductsResult,
} from "@/lib/meilisearch/search-query";
import { ProductGrid } from "@/components/product/product-grid";
import type { ProductListItem } from "@/lib/queries/products";
import type { SearchHit } from "@/lib/meilisearch/types";
import { EmptySearchState } from "./empty-search-state";

interface SearchResultsClientProps {
  initialQuery: string;
  initialData: SearchProductsResult | null;
}

function mapHitToProduct(hit: SearchHit): ProductListItem {
  return {
    id: hit.id,
    slug: hit.slug,
    name: hit.name,
    brand: hit.brand,
    brand_slug: hit.brand_slug,
    price: hit.price,
    compare_at_price: hit.compare_at_price,
    category_slug: hit.category_slug,
    stock: hit.stock,
    certification: hit.certification,
    rider_type: hit.rider_type,
    primary_image_url: hit.primary_image_url,
    primary_image_alt: hit.primary_image_alt,
    average_rating: hit.rating,
    review_count: hit.review_count,
  };
}

export function SearchResultsClient({
  initialQuery,
  initialData,
}: SearchResultsClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [data, setData] = useState<SearchProductsResult | null>(initialData);
  const [isLoading, setIsLoading] = useState(false);

  const q = searchParams.get("q") ?? initialQuery;
  const page = Number(searchParams.get("page") ?? "1");

  const fetchResults = useCallback(async () => {
    if (!q) return;
    setIsLoading(true);
    try {
      const result = await searchProducts({
        q,
        brand: searchParams.get("brand") ?? undefined,
        category: searchParams.get("category") ?? undefined,
        priceMin: searchParams.get("price_min")
          ? Number(searchParams.get("price_min"))
          : undefined,
        priceMax: searchParams.get("price_max")
          ? Number(searchParams.get("price_max"))
          : undefined,
        sort: searchParams.get("sort") ?? undefined,
        page,
      });
      setData(result);
    } finally {
      setIsLoading(false);
    }
  }, [q, searchParams, page]);

  useEffect(() => {
    if (q !== initialQuery) {
      fetchResults();
    }
  }, [fetchResults, q, initialQuery]);

  const updateParam = (key: string, value: string | null) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    params.set("page", "1");
    router.push(`/search?${params.toString()}`);
  };

  if (!q) {
    return (
      <p className="text-zinc-500">
        Πληκτρολογήστε κάτι για να αναζητήσετε προϊόντα.
      </p>
    );
  }

  if (!isLoading && data?.hits.length === 0) {
    return <EmptySearchState query={q} />;
  }

  const products = (data?.hits ?? []).map(mapHitToProduct);

  return (
    <div>
      <div className="mb-4 flex items-center justify-between gap-4">
        <div className="flex gap-2">
          <select
            value={searchParams.get("sort") ?? "relevance"}
            onChange={(e) =>
              updateParam(
                "sort",
                e.target.value === "relevance" ? null : e.target.value,
              )
            }
            className="rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-sm outline-none dark:border-zinc-700 dark:bg-zinc-800"
          >
            <option value="relevance">Σχετικότητα</option>
            <option value="price_asc">Τιμή ↑</option>
            <option value="price_desc">Τιμή ↓</option>
            <option value="rating">Αξιολόγηση</option>
            <option value="newest">Νεότερα</option>
          </select>
        </div>
      </div>

      <ProductGrid products={products} />

      {data && data.totalHits > data.hitsPerPage && (
        <div className="mt-8 flex justify-center gap-2">
          {page > 1 && (
            <button
              onClick={() => updateParam("page", String(page - 1))}
              className="rounded-md border px-4 py-2 text-sm hover:bg-accent"
            >
              Προηγούμενη
            </button>
          )}
          <span className="flex items-center px-4 text-sm text-muted-foreground">
            Σελίδα {page} / {Math.ceil(data.totalHits / data.hitsPerPage)}
          </span>
          {page < Math.ceil(data.totalHits / data.hitsPerPage) && (
            <button
              onClick={() => updateParam("page", String(page + 1))}
              className="rounded-md border px-4 py-2 text-sm hover:bg-accent"
            >
              Επόμενη
            </button>
          )}
        </div>
      )}
    </div>
  );
}
