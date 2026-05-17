import type { Metadata } from "next";
import { notFound } from "next/navigation";
import MMShell from "@/components/mm/mm-shell";
import { getProduct, getProductsByCategory } from "@/lib/queries/products";
import { PDPContent } from "./pdp-content";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://motomarket.gr";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const p = await getProduct(slug);
  if (!p) return { title: "Product not found" };
  return {
    title: `${p.brand} ${p.name} | Motomarket`,
    description: p.description ?? p.name,
    alternates: { canonical: `${BASE_URL}/product/${slug}` },
    openGraph: { images: p.images.map((i) => i.url), type: "website" },
  };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product) notFound();

  /* Related = other products in same category (excluding current) */
  const relatedRes = await getProductsByCategory({
    categorySlug: product.category_slug,
    perPage: 5,
    sort: "popular",
  });
  const related = relatedRes.data
    .filter((p) => p.slug !== product.slug)
    .slice(0, 4);

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
    <MMShell mode="dark">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }}
      />
      <PDPContent product={product} related={related} />
    </MMShell>
  );
}
