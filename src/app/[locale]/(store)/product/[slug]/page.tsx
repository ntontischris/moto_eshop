import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import type { Locale } from "@/i18n/config";
import { buildAlternates } from "@/i18n/metadata";
import {
  getProduct,
  getRelatedProducts,
  getPopularProductSlugs,
} from "@/lib/queries/products";
import { ProductCard } from "../../_components/commerce/product-card";
import { PDPClient } from "./pdp-client";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://motomarket.gr";

// Static params seeding (required by Next.js 16 Cache Components).
// This route reads no request-time input and all its data is "use cache", so
// without seeded params Next prerenders a single shell — rendered with no slug
// it hits notFound(), and that baked 404 gets served for every product. Seeding
// popular slugs gives real prerenders; the rest render on-demand (dynamicParams)
// with the actual slug. Mirrors the catch-all [...path] route.
export async function generateStaticParams() {
  const slugs = await getPopularProductSlugs(50);
  return slugs.slice(0, 10).map((s) => ({ slug: s.slug }));
}

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
}) {
  return (
    <Suspense fallback={<ProductPageFallback />}>
      <V3ProductPageContent {...props} />
    </Suspense>
  );
}

async function V3ProductPageContent({
  params,
}: {
  params: Promise<{ locale: Locale; slug: string }>;
}) {
  const { locale, slug } = await params;
  const product = await getProduct(slug, locale);
  if (!product) notFound();

  const relatedAll = await getRelatedProducts(
    product.id,
    product.category_slug,
    8,
    locale,
  );
  const related = relatedAll.filter((p) => p.slug !== product.slug).slice(0, 4);

  const ld = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: `${product.brand} ${product.name}`,
    image: product.images.map((i) => i.url),
    description: product.description ?? product.name,
    sku: product.sku,
    brand: { "@type": "Brand", name: product.brand },
    aggregateRating: product.average_rating
      ? {
          "@type": "AggregateRating",
          ratingValue: product.average_rating,
          reviewCount: product.review_count,
        }
      : undefined,
    offers: {
      "@type": "Offer",
      url: `${BASE_URL}/product/${slug}`,
      priceCurrency: "EUR",
      price: product.price.toFixed(2),
      availability:
        product.stock > 0
          ? "https://schema.org/InStock"
          : "https://schema.org/OutOfStock",
      itemCondition: "https://schema.org/NewCondition",
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }}
      />
      <PDPClient
        product={product}
        related={related.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      />
    </>
  );
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
