import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCategory, getSubcategories } from "@/lib/queries/categories";
import {
  getProductFilters,
  getProductsByCategory,
} from "@/lib/queries/products";
import { parsePlpParams } from "../../_lib/plp-params";
import { ProductCard } from "../../_components/commerce/product-card";
import { PLPClient } from "./plp-client";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://motomarket.gr";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const cat = await getCategory(slug);
  if (!cat) return { title: "Category not found" };
  return {
    title: `${cat.name} | MotoMarket`,
    description:
      cat.seo_intro ??
      cat.description ??
      `${cat.name} από όλα τα κορυφαία brands.`,
    alternates: { canonical: `${BASE_URL}/category/${slug}` },
  };
}

type SearchParams = Record<string, string | string[] | undefined>;

export default async function V3CategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<SearchParams>;
}) {
  const { slug } = await params;
  const sp = await searchParams;

  const cat = await getCategory(slug);
  if (!cat) notFound();

  const state = parsePlpParams(sp);

  const [result, filters, subcats] = await Promise.all([
    getProductsByCategory({
      categorySlug: slug,
      page: state.page,
      perPage: 24,
      sort: state.sort,
      brands: state.brands.length ? state.brands : undefined,
      priceMin: state.priceMin,
      priceMax: state.priceMax,
    }),
    getProductFilters(slug),
    getSubcategories(slug),
  ]);

  return (
    <PLPClient
      slug={slug}
      title={cat.name}
      seoIntro={cat.seo_intro ?? cat.description}
      subcategories={subcats.map((s) => ({ slug: s.slug, name: s.name }))}
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
