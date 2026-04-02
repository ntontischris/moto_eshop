import { notFound } from "next/navigation";
import type { Metadata } from "next";

import { getCategory, getCategoryBreadcrumbs } from "@/lib/queries/categories";
import {
  getProductsByCategory,
  getProductFilters,
  type SortOption,
} from "@/lib/queries/products";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { ProductGrid } from "@/components/product/product-grid";
import { FilterSidebar } from "@/components/product/filter-sidebar";
import { SortDropdown } from "@/components/product/sort-dropdown";
import { Pagination } from "@/components/ui/pagination";
import { CategoryHeader } from "@/components/product/category-header";
import { JsonLd } from "@/components/seo/json-ld";
import { generateCollectionPageSchema } from "@/lib/schema/category";

interface CategoryPageProps {
  params: Promise<{ category: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export async function generateMetadata({
  params,
}: CategoryPageProps): Promise<Metadata> {
  const { category: categorySlug } = await params;
  const category = await getCategory(categorySlug);

  if (!category) return { title: "Κατηγορία δεν βρέθηκε" };

  const description =
    category.description ??
    `Αγοράστε ${category.name} online. Μεγάλη ποικιλία, γρήγορη αποστολή, εγγύηση τιμής.`;

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://motomarket.gr";
  const canonical = `${baseUrl}/${categorySlug}`;

  return {
    title: `${category.name} | MotoMarket`,
    description,
    alternates: { canonical },
    openGraph: {
      title: `${category.name} | MotoMarket`,
      description,
      url: canonical,
      images: category.image_url ? [{ url: category.image_url }] : [],
    },
  };
}

function firstString(value: string | string[] | undefined): string | undefined {
  if (!value) return undefined;
  return Array.isArray(value) ? value[0] : value;
}

function allStrings(value: string | string[] | undefined): string[] {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

function parseNumber(value: string | string[] | undefined): number | undefined {
  const str = firstString(value);
  if (!str) return undefined;
  const n = Number(str);
  return Number.isNaN(n) ? undefined : n;
}

function flattenSearchParams(
  sp: Record<string, string | string[] | undefined>,
): Record<string, string> {
  const result: Record<string, string> = {};
  for (const [key, val] of Object.entries(sp)) {
    if (val === undefined) continue;
    result[key] = Array.isArray(val) ? val.join(",") : val;
  }
  return result;
}

export default async function CategoryPage({
  params,
  searchParams,
}: CategoryPageProps) {
  const { category: categorySlug } = await params;
  const sp = await searchParams;

  const [category, breadcrumbs] = await Promise.all([
    getCategory(categorySlug),
    getCategoryBreadcrumbs(categorySlug),
  ]);

  if (!category) notFound();

  const page = parseNumber(sp.page) ?? 1;
  const sort = (firstString(sp.sort) as SortOption) ?? "popular";
  const minRating = parseNumber(sp.min_rating);

  const [result, filters] = await Promise.all([
    getProductsByCategory({
      categorySlug,
      page,
      perPage: 24,
      sort,
      brands: allStrings(sp.brand),
      priceMin: parseNumber(sp.price_min),
      priceMax: parseNumber(sp.price_max),
      certifications: allStrings(sp.cert),
      riderTypes: allStrings(sp.rider),
      minRating,
    }),
    getProductFilters(categorySlug),
  ]);

  const flatParams = flattenSearchParams(sp);

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://motomarket.gr";
  const collectionSchema = generateCollectionPageSchema(
    category,
    result.data.map((p) => ({ slug: p.slug, name: p.name })),
    `${baseUrl}/${categorySlug}`,
  );

  return (
    <main className="container mx-auto px-4 py-6">
      <JsonLd data={collectionSchema} />
      <Breadcrumbs items={breadcrumbs} />
      <CategoryHeader category={category} />

      <div className="mt-6 flex flex-col gap-6 lg:flex-row">
        <FilterSidebar filters={filters} />

        <div className="min-w-0 flex-1">
          <div className="mb-4 flex items-center justify-between gap-4">
            <p className="shrink-0 text-sm text-muted-foreground">
              {result.total} {result.total === 1 ? "προϊόν" : "προϊόντα"}
            </p>
            <SortDropdown />
          </div>

          <ProductGrid products={result.data} />

          <Pagination
            currentPage={result.page}
            totalPages={result.totalPages}
            baseHref={`/${categorySlug}`}
            searchParams={flatParams}
          />
        </div>
      </div>
    </main>
  );
}
