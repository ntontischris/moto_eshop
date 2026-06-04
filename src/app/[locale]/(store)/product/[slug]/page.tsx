import type { Metadata } from "next";
import { Suspense } from "react";
import type { Locale } from "@/i18n/config";
import { buildAlternates } from "@/i18n/metadata";
import { getProduct } from "@/lib/queries/products";
import { ProductView } from "../../_components/pdp/product-view";

type SearchParams = Record<string, string | string[] | undefined>;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const p = await getProduct(slug, locale);
  if (!p) return { title: "Product not found" };
  return {
    title: `${p.brand} ${p.name} | MotoMarket`,
    description: p.description ?? p.name,
    alternates: buildAlternates(locale, `/product/${slug}`),
    openGraph: { images: p.images.map((i) => i.url), type: "website" },
  };
}

export default function V3ProductPage(props: {
  params: Promise<{ locale: Locale; slug: string }>;
  searchParams: Promise<SearchParams>;
}) {
  return (
    <Suspense fallback={<ProductPageFallback />}>
      <V3ProductPageContent {...props} />
    </Suspense>
  );
}

async function V3ProductPageContent({
  params,
  searchParams,
}: {
  params: Promise<{ locale: Locale; slug: string }>;
  searchParams: Promise<SearchParams>;
}) {
  const { locale, slug } = await params;
  // Read a request-time input so this route renders per-request (Next.js 16
  // Cache Components) instead of serving one shared prerendered [slug] shell.
  // Without it, every non-seeded slug maps to that single shell — baked as
  // notFound() on prod — and 404s every product. Mirrors the working
  // category/[slug], which renders fine for all categories because it does this.
  await searchParams;
  return <ProductView slug={slug} locale={locale} />;
}

function ProductPageFallback() {
  return (
    <div className="v3-pdp" aria-hidden="true">
      <div className="v3-pdp-top">
        <div className="v3-gal v3-gal--empty" />
        <div className="v3-bb">
          <div className="h-8 w-3/4 rounded bg-white/10" />
          <div className="mt-4 h-28 rounded bg-white/10" />
          <div className="mt-4 h-12 rounded bg-white/10" />
        </div>
      </div>
    </div>
  );
}
