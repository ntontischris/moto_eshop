import type { Metadata } from "next";
import { Suspense } from "react";
import { searchProducts } from "@/lib/meilisearch/search-query";
import { SearchResultsClient } from "./search-results-client";

interface SearchPageProps {
  searchParams: Promise<{
    q?: string;
    brand?: string;
    category?: string;
    price_min?: string;
    price_max?: string;
    sort?: string;
    page?: string;
  }>;
}

export async function generateMetadata({
  searchParams,
}: SearchPageProps): Promise<Metadata> {
  const params = await searchParams;
  const q = params.q ?? "";
  return {
    title: q
      ? `Αποτελέσματα για "${q}" | MotoMarket`
      : "Αναζήτηση | MotoMarket",
    robots: { index: false },
  };
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const params = await searchParams;
  const q = params.q ?? "";
  const page = Math.max(1, Number(params.page ?? "1"));

  const initialData = q
    ? await searchProducts({
        q,
        brand: params.brand,
        category: params.category,
        priceMin: params.price_min ? Number(params.price_min) : undefined,
        priceMax: params.price_max ? Number(params.price_max) : undefined,
        sort: params.sort,
        page,
      })
    : null;

  return (
    <main className="container mx-auto px-4 py-8">
      <h1 className="mb-2 text-2xl font-bold">
        {q ? (
          <>
            Αποτελέσματα για{" "}
            <span className="text-blue-600 dark:text-blue-400">
              &quot;{q}&quot;
            </span>
          </>
        ) : (
          "Αναζήτηση"
        )}
      </h1>
      {initialData && (
        <p className="mb-6 text-sm text-zinc-500">
          {initialData.totalHits.toLocaleString("el-GR")} αποτελέσματα
        </p>
      )}
      <Suspense fallback={<SearchResultsSkeleton />}>
        <SearchResultsClient initialQuery={q} initialData={initialData} />
      </Suspense>
    </main>
  );
}

function SearchResultsSkeleton() {
  return (
    <div className="flex animate-pulse gap-8">
      <div className="hidden w-64 shrink-0 space-y-4 lg:block">
        {Array.from({ length: 4 }, (_, i) => (
          <div
            key={i}
            className="h-32 rounded-xl bg-zinc-100 dark:bg-zinc-800"
          />
        ))}
      </div>
      <div className="grid flex-1 grid-cols-2 gap-4 md:grid-cols-3">
        {Array.from({ length: 9 }, (_, i) => (
          <div
            key={i}
            className="aspect-square rounded-xl bg-zinc-100 dark:bg-zinc-800"
          />
        ))}
      </div>
    </div>
  );
}
