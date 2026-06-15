import "./plp.css";
import { notFound } from "next/navigation";
import type { Locale } from "@/i18n/config";
import { getCategory, getSubcategories } from "@/lib/queries/categories";
import {
  getProductFilters,
  getProductsByCategory,
} from "@/lib/queries/products";
import { parsePlpParams } from "../../_lib/plp-params";
import { categoryPath } from "../../_lib/urls";
import { ProductCard } from "../commerce/product-card";
import { PLPClient } from "../../category/[slug]/plp-client";

type SearchParams = Record<string, string | string[] | undefined>;

/**
 * Route-agnostic v3 category listing view: resolve → fetch → render. Rendered
 * by the canonical `[...path]` catch-all (and, until it becomes a redirector,
 * by the prefixed `category/[slug]` route). The caller awaits `searchParams`
 * and passes the resolved object in.
 */
export async function CategoryView({
  slug,
  locale,
  searchParams,
}: {
  slug: string;
  locale: Locale;
  searchParams: SearchParams;
}) {
  const cat = await getCategory(slug, locale);
  if (!cat) notFound();

  const state = parsePlpParams(searchParams);

  const [result, filters, subcats] = await Promise.all([
    getProductsByCategory(
      {
        categorySlug: slug,
        page: state.page,
        perPage: 24,
        sort: state.sort,
        brands: state.brands.length ? state.brands : undefined,
        priceMin: state.priceMin,
        priceMax: state.priceMax,
      },
      locale,
    ),
    getProductFilters(slug),
    getSubcategories(slug, locale),
  ]);

  return (
    <PLPClient
      basePath={cat.full_path ? categoryPath(cat.full_path) : `/${slug}`}
      title={cat.name}
      seoIntro={cat.seo_intro ?? cat.description}
      subcategories={subcats.map((s) => ({
        path: s.full_path ? categoryPath(s.full_path) : `/${s.slug}`,
        name: s.name,
      }))}
      filters={filters}
      state={state}
      total={result.total}
      page={result.page}
      totalPages={result.totalPages}
    >
      {result.data.map((p) => (
        <ProductCard key={p.id} product={p} />
      ))}
    </PLPClient>
  );
}
