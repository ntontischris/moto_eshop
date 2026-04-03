import { notFound } from "next/navigation";
import { Suspense } from "react";
import type { Metadata } from "next";

import {
  getProduct,
  getPopularProductSlugs,
  getRelatedProducts,
} from "@/lib/queries/products";
import { getCategoryBreadcrumbs } from "@/lib/queries/categories";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { ImageGallery } from "@/components/product/image-gallery";
import { PriceDisplay } from "@/components/ui/price-display";
import { StockBadge } from "@/components/ui/stock-badge";
import { CertificationBadge } from "@/components/ui/certification-badge";
import { RatingStars } from "@/components/ui/rating-stars";
import { ProductGrid } from "@/components/product/product-grid";
import { VariantSelector } from "@/components/product/variant-selector";
import { AddToCartButton } from "@/components/cart/add-to-cart-button";
import { SpecificationsTable } from "@/components/product/specifications-table";
import { DeliveryEstimate } from "@/components/product/delivery-estimate";
import { KlarnaInfo } from "@/components/product/klarna-info";
import { ProductJsonLd } from "@/components/product/product-json-ld";

export async function generateStaticParams() {
  const slugs = await getPopularProductSlugs(100);
  return slugs.map((s) => ({
    category: s.category_slug,
    slug: s.slug,
  }));
}

interface ProductPageProps {
  params: Promise<{ category: string; slug: string }>;
}

export async function generateMetadata({
  params,
}: ProductPageProps): Promise<Metadata> {
  const { category, slug } = await params;
  const product = await getProduct(slug);

  if (!product) return { title: "Προϊόν δεν βρέθηκε" };

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://motomarket.gr";
  const canonical = `${baseUrl}/${category}/${slug}`;

  const discountSuffix =
    product.compare_at_price && product.compare_at_price > product.price
      ? ` | -${Math.round(((product.compare_at_price - product.price) / product.compare_at_price) * 100)}%`
      : "";

  const description =
    product.description?.slice(0, 160) ??
    `${product.name} από ${product.brand}. Αγοράστε online στο MotoMarket.`;

  return {
    title: `${product.name} | ${product.brand} | MotoMarket`,
    description,
    alternates: { canonical },
    openGraph: {
      title: `${product.name}${discountSuffix}`,
      description,
      url: canonical,
      images: product.images[0]
        ? [{ url: product.images[0].url, alt: product.images[0].alt }]
        : [],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: `${product.name} | ${product.brand}`,
      description,
    },
  };
}

async function RelatedProducts({
  productId,
  categorySlug,
}: {
  productId: string;
  categorySlug: string;
}) {
  const related = await getRelatedProducts(productId, categorySlug);
  if (related.length === 0) return null;

  return (
    <section className="mt-12">
      <h2 className="mb-6 text-xl font-bold">Σχετικά προϊόντα</h2>
      <ProductGrid products={related} />
    </section>
  );
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { category, slug } = await params;
  const product = await getProduct(slug);

  if (!product || product.category_slug !== category) {
    notFound();
  }

  const breadcrumbs = await getCategoryBreadcrumbs(category);
  breadcrumbs.push({ label: product.name, href: `/${category}/${slug}` });

  const sizesFromSpecs = product.specs["sizes"] ?? product.specs["Μέγεθος"];
  const sizes = sizesFromSpecs
    ? sizesFromSpecs
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
    : [];

  return (
    <main className="container mx-auto px-4 py-6">
      <ProductJsonLd product={product} />
      <Breadcrumbs items={breadcrumbs} />

      <div className="grid gap-8 lg:grid-cols-2">
        <ImageGallery images={product.images} productName={product.name} />

        <div className="space-y-5">
          <p className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
            {product.brand}
          </p>

          <h1 className="text-2xl font-bold leading-tight lg:text-3xl">
            {product.name}
          </h1>

          {product.average_rating !== null && product.review_count > 0 && (
            <RatingStars
              rating={product.average_rating}
              reviewCount={product.review_count}
              size="md"
            />
          )}

          {product.certification && (
            <CertificationBadge certification={product.certification} />
          )}

          <PriceDisplay
            price={product.price}
            compareAtPrice={product.compare_at_price}
            size="lg"
          />

          <KlarnaInfo price={product.price} />

          {sizes.length > 0 && <VariantSelector sizes={sizes} colors={[]} />}

          <StockBadge stock={product.stock} />

          <DeliveryEstimate inStock={product.stock > 0} />

          <AddToCartButton
            productId={product.id}
            productName={product.name}
            unitPrice={product.price}
            stock={product.stock}
          />

          {product.description && (
            <div className="prose prose-sm max-w-none border-t pt-4">
              <p>{product.description}</p>
            </div>
          )}
        </div>
      </div>

      {Object.keys(product.specs).length > 0 && (
        <section className="mt-12">
          <h2 className="mb-4 text-xl font-bold">Τεχνικά χαρακτηριστικά</h2>
          <SpecificationsTable specs={product.specs} />
        </section>
      )}

      <Suspense
        fallback={
          <div className="mt-12 h-64 animate-pulse rounded-lg bg-muted" />
        }
      >
        <RelatedProducts productId={product.id} categorySlug={category} />
      </Suspense>
    </main>
  );
}
