import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import type { Locale } from "@/i18n/config";
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
  params: Promise<{ locale: Locale; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const cat = await getCategory(slug, locale);
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

export default function V3CategoryPage(props: {
  params: Promise<{ locale: Locale; slug: string }>;
  searchParams: Promise<SearchParams>;
}) {
  return (
    <Suspense fallback={<CategoryPageFallback />}>
      <V3CategoryPageContent {...props} />
    </Suspense>
  );
}

async function V3CategoryPageContent({
  params,
  searchParams,
}: {
  params: Promise<{ locale: Locale; slug: string }>;
  searchParams: Promise<SearchParams>;
}) {
  const { locale, slug } = await params;
  const sp = await searchParams;

  const cat = await getCategory(slug, locale);
  if (!cat) notFound();

  const state = parsePlpParams(sp);

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

function CategoryPageFallback() {
  return (
    <section className="v3-rail v3-rail--reconstructed" aria-hidden="true">
      <div className="v3-rail-inner">
        <div className="v3-rail-head">
          <div className="v3-rail-htitle">
            <div>
              <p className="v3-label">MotoMarket</p>
              <h2 className="v3-display">Loading collection</h2>
            </div>
          </div>
        </div>
        <div className="v3-rail-track">
          {Array.from({ length: 4 }).map((_, index) => (
            <div className="v3-product-card" key={index}>
              <div className="v3-product-image" />
              <div className="v3-product-body">
                <div className="h-4 w-24 rounded bg-white/10" />
                <div className="h-6 w-4/5 rounded bg-white/10" />
                <div className="h-10 rounded bg-white/10" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
