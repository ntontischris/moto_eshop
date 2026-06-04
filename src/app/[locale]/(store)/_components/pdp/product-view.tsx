import { notFound } from "next/navigation";
import type { Locale } from "@/i18n/config";
import { getProduct, getRelatedProducts } from "@/lib/queries/products";
import { ProductCard } from "../commerce/product-card";
import { PDPClient } from "../../product/[slug]/pdp-client";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://motomarket.gr";

/**
 * Route-agnostic v3 product detail view: resolve → fetch → render. Rendered by
 * the canonical `[...path]` catch-all (and, until it becomes a redirector, by
 * the prefixed `product/[slug]` route). The caller owns the request-time read
 * (`await searchParams`) that keeps Next.js 16 Cache Components per-request.
 */
export async function ProductView({
  slug,
  locale,
}: {
  slug: string;
  locale: Locale;
}) {
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
      url: `${BASE_URL}${product.category_path ? `/${product.category_path}` : ""}/${product.slug}`,
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
