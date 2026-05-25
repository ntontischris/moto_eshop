/**
 * Catch-all route for Option B clean path-based URLs.
 *
 *   /eksoplismos-anabath/endysh/mpoyfan                 → category listing
 *   /eksoplismos-anabath/endysh/mpoyfan/abudisloc30     → product page
 *
 * Logic:
 *   1. Try interpret the last segment as a product slug. If a product exists
 *      AND its category.full_path matches path.slice(0,-1), serve product page.
 *   2. Else try interpret the full path as a category.full_path. If found,
 *      serve category listing.
 *   3. Else 404.
 *
 * Legacy redirect: if a product exists at a *different* path, 301-redirect
 * to its canonical URL so old links and Google index aren't broken.
 */

import { notFound } from "next/navigation";
import { redirect } from "@/i18n/navigation";
import { Suspense } from "react";
import type { Metadata } from "next";
import type { Locale } from "@/i18n/config";

import {
  getProduct,
  getRelatedProducts,
  getProductsByCategory,
  getProductFilters,
  getPopularProductSlugs,
  type SortOption,
} from "@/lib/queries/products";
import { getCategoryByPath } from "@/lib/queries/categories";
import { createClient } from "@/lib/supabase/server";

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
import { MobileCtaBar } from "@/components/product/mobile-cta-bar";
import { CategoryHeader } from "@/components/product/category-header";
import { FilterSidebar } from "@/components/product/filter-sidebar";
import { SortDropdown } from "@/components/product/sort-dropdown";
import { Pagination } from "@/components/ui/pagination";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://motomarket.gr";

// ────────────────────────────────────────────────────────────────────────
// Static params seeding (required by Next.js Cache Components)
// ────────────────────────────────────────────────────────────────────────
export async function generateStaticParams() {
  const slugs = await getPopularProductSlugs(50);
  // Provide at least one entry; the rest is rendered on-demand
  if (slugs.length === 0) {
    return [{ path: ["__placeholder__"] }];
  }
  return slugs.slice(0, 10).map((s) => ({
    path: [s.category_slug, s.slug],
  }));
}

// ────────────────────────────────────────────────────────────────────────
// Resolution: figure out if path is product, category, or unknown
// ────────────────────────────────────────────────────────────────────────
type Resolved =
  | {
      kind: "product";
      productId: string;
      productSlug: string;
      canonicalPath: string[];
    }
  | { kind: "category"; categoryId: string; fullPath: string }
  | { kind: "not_found" };

async function resolvePath(segments: string[]): Promise<Resolved> {
  if (segments.length === 0) return { kind: "not_found" };

  // ── 1. last segment as product slug ────────────────────────────────
  const last = segments[segments.length - 1];
  const parentPath = segments.slice(0, -1).join("/");

  const supabase = await createClient();
  const { data: productHit } = await supabase
    .from("products")
    .select("id, slug, category_id, categories(full_path)")
    .eq("slug", last)
    .eq("status", "active")
    .maybeSingle();

  if (productHit) {
    const cat = productHit.categories as unknown as {
      full_path: string | null;
    } | null;
    const canonicalParent = cat?.full_path ?? "";
    const canonicalPath = canonicalParent
      ? [...canonicalParent.split("/"), productHit.slug]
      : [productHit.slug];

    if (canonicalParent && parentPath !== canonicalParent) {
      // Mismatch: redirect to canonical URL
      return {
        kind: "product",
        productId: productHit.id,
        productSlug: productHit.slug,
        canonicalPath,
      };
    }
    return {
      kind: "product",
      productId: productHit.id,
      productSlug: productHit.slug,
      canonicalPath,
    };
  }

  // ── 2. full path as category ───────────────────────────────────────
  const fullPath = segments.join("/");
  const category = await getCategoryByPath(fullPath);
  if (category) {
    return { kind: "category", categoryId: category.id, fullPath };
  }

  return { kind: "not_found" };
}

// ────────────────────────────────────────────────────────────────────────
// Metadata
// ────────────────────────────────────────────────────────────────────────
interface PageProps {
  params: Promise<{ locale: Locale; path: string[] }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { locale, path: segments } = await params;
  const resolved = await resolvePath(segments);
  if (resolved.kind === "product") {
    const product = await getProduct(resolved.productSlug, locale);
    if (!product) return { title: "Δεν βρέθηκε" };
    const canonical = `${BASE_URL}/${resolved.canonicalPath.join("/")}`;
    return {
      title: `${product.name} | ${product.brand} | MotoMarket`,
      description: product.description?.slice(0, 160) ?? product.name,
      alternates: { canonical },
      openGraph: {
        title: product.name,
        description: product.description?.slice(0, 160) ?? "",
        url: canonical,
        images: product.images.slice(0, 4).map((img) => ({
          url: img.url,
          alt: img.alt,
        })),
        type: "website",
      },
    };
  }
  if (resolved.kind === "category") {
    const category = await getCategoryByPath(resolved.fullPath);
    if (!category) return { title: "Κατηγορία δεν βρέθηκε" };
    return {
      title: `${category.name} | MotoMarket`,
      description:
        category.description ??
        `Αγοράστε ${category.name} online στο MotoMarket.`,
      alternates: { canonical: `${BASE_URL}/${resolved.fullPath}` },
    };
  }
  return { title: "Δεν βρέθηκε" };
}

// ────────────────────────────────────────────────────────────────────────
// Page
// ────────────────────────────────────────────────────────────────────────
export default function CatchAllPage(props: PageProps) {
  return (
    <Suspense fallback={<CatchAllFallback />}>
      <CatchAllContent {...props} />
    </Suspense>
  );
}

async function CatchAllContent({ params, searchParams }: PageProps) {
  const { locale, path: segments } = await params;
  const sp = await searchParams;
  const resolved = await resolvePath(segments);

  if (resolved.kind === "not_found") notFound();

  if (resolved.kind === "product") {
    // Redirect to canonical URL if user landed on a non-canonical path
    const currentPath = segments.join("/");
    const canonical = resolved.canonicalPath.join("/");
    if (currentPath !== canonical && resolved.canonicalPath.length > 1) {
      redirect({ href: `/${canonical}`, locale });
    }
    return (
      <ProductView
        slug={resolved.productSlug}
        pathSegments={segments}
        locale={locale}
      />
    );
  }

  // category
  return (
    <CategoryView
      fullPath={resolved.fullPath}
      searchParams={sp}
      locale={locale}
    />
  );
}

function CatchAllFallback() {
  return (
    <main className="container mx-auto px-4 py-10" aria-hidden="true">
      <div className="mb-8 space-y-3">
        <div className="h-8 w-80 max-w-full rounded bg-muted" />
        <div className="h-4 w-48 rounded bg-muted" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div className="h-80 rounded-lg bg-muted" key={index} />
        ))}
      </div>
    </main>
  );
}

// ────────────────────────────────────────────────────────────────────────
// Product view (mostly ported from (shop)/[category]/[slug]/page.tsx)
// ────────────────────────────────────────────────────────────────────────
async function ProductView({
  slug,
  pathSegments,
  locale,
}: {
  slug: string;
  pathSegments: string[];
  locale: Locale;
}) {
  const product = await getProduct(slug, locale);
  if (!product) notFound();

  // Build breadcrumbs from the URL path (skip the trailing product slug)
  const breadcrumbs: { label: string; href: string }[] = [
    { label: "Αρχική", href: "/" },
  ];
  const parents = pathSegments.slice(0, -1);
  let acc = "";
  for (const seg of parents) {
    acc = acc ? `${acc}/${seg}` : seg;
    const cat = await getCategoryByPath(acc);
    if (cat) breadcrumbs.push({ label: cat.name, href: `/${acc}` });
  }
  breadcrumbs.push({
    label: product.name,
    href: `/${pathSegments.join("/")}`,
  });

  const sizesFromSpecs = product.specs["sizes"] ?? product.specs["Μέγεθος"];
  const sizes = sizesFromSpecs
    ? sizesFromSpecs
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
    : [];

  return (
    <main className="container mx-auto px-4 py-6 pb-24 lg:pb-6">
      <ProductJsonLd product={product} />
      <Breadcrumbs items={breadcrumbs} />

      <div className="grid gap-8 lg:grid-cols-[1.5fr_1fr] lg:items-start">
        <ImageGallery images={product.images} productName={product.name} />

        <div className="space-y-5 lg:sticky lg:top-24 lg:self-start">
          {product.brand && (
            <span className="inline-flex rounded-full bg-brand-red/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-brand-red">
              {product.brand}
            </span>
          )}

          <h1 className="font-russo text-3xl uppercase leading-tight text-white lg:text-4xl">
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

          <div className="border-y border-neutral-800 py-4">
            <PriceDisplay
              price={product.price}
              compareAtPrice={product.compare_at_price}
              size="lg"
            />
            <KlarnaInfo price={product.price} />
          </div>

          {sizes.length > 0 && (
            <div>
              <p className="mb-2 text-xs font-bold uppercase tracking-wider text-neutral-400">
                Διαθέσιμα μεγέθη
              </p>
              <VariantSelector sizes={sizes} colors={[]} />
            </div>
          )}

          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-wider text-neutral-400">
              Διαθεσιμότητα
            </p>
            <StockBadge stock={product.stock} />
          </div>

          <AddToCartButton
            productId={product.id}
            productName={product.name}
            unitPrice={product.price}
            stock={product.stock}
          />

          <DeliveryEstimate inStock={product.stock > 0} />

          {product.description && (
            <details className="border-t border-neutral-800 pt-4">
              <summary className="cursor-pointer text-sm font-bold uppercase tracking-wider text-white">
                Περιγραφή
              </summary>
              <p className="prose prose-sm prose-invert mt-3 max-w-none whitespace-pre-wrap">
                {product.description}
              </p>
            </details>
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
        <RelatedProductsSection
          productId={product.id}
          categoryPathSegments={pathSegments.slice(0, -1)}
          locale={locale}
        />
      </Suspense>

      <MobileCtaBar
        productId={product.id}
        productName={product.name}
        price={product.price}
        compareAtPrice={product.compare_at_price}
        stock={product.stock}
      />
    </main>
  );
}

async function RelatedProductsSection({
  productId,
  categoryPathSegments,
  locale,
}: {
  productId: string;
  categoryPathSegments: string[];
  locale: Locale;
}) {
  // Use the leaf category slug as the category for related lookup
  const leaf = categoryPathSegments[categoryPathSegments.length - 1] ?? "";
  if (!leaf) return null;
  const related = await getRelatedProducts(productId, leaf, 8, locale);
  if (related.length === 0) return null;
  return (
    <section className="mt-12">
      <h2 className="mb-6 text-xl font-bold">Σχετικά προϊόντα</h2>
      <ProductGrid products={related} />
    </section>
  );
}

// ────────────────────────────────────────────────────────────────────────
// Category view (listing)
// ────────────────────────────────────────────────────────────────────────
async function CategoryView({
  fullPath,
  searchParams,
  locale,
}: {
  fullPath: string;
  searchParams: Record<string, string | string[] | undefined>;
  locale: Locale;
}) {
  const category = await getCategoryByPath(fullPath);
  if (!category) notFound();

  // Reuse existing listing query — it expects slug; we pass the leaf slug.
  // (Listing queries category by joining category_id via slug match — but
  // we have category.id, which is more reliable.)
  const sort = (searchParams.sort as SortOption | undefined) ?? "popular";
  const page = Number(searchParams.page ?? 1) || 1;

  const brandFilter = searchParams.brand as string | undefined;
  const [listing, filters] = await Promise.all([
    getProductsByCategory(
      {
        categorySlug: category.slug,
        sort,
        page,
        perPage: 24,
        brands: brandFilter ? [brandFilter] : undefined,
        priceMin: searchParams.priceMin
          ? Number(searchParams.priceMin)
          : undefined,
        priceMax: searchParams.priceMax
          ? Number(searchParams.priceMax)
          : undefined,
      },
      locale,
    ),
    getProductFilters(category.slug),
  ]);
  const products = listing.data;
  const totalPages = listing.totalPages;

  // Breadcrumbs from full path
  const breadcrumbs: { label: string; href: string }[] = [
    { label: "Αρχική", href: "/" },
  ];
  const segs = fullPath.split("/");
  let acc = "";
  for (const seg of segs) {
    acc = acc ? `${acc}/${seg}` : seg;
    const cat = await getCategoryByPath(acc);
    if (cat) breadcrumbs.push({ label: cat.name, href: `/${acc}` });
  }

  return (
    <main className="container mx-auto px-4 py-6">
      <Breadcrumbs items={breadcrumbs} />
      <CategoryHeader category={category} />

      <div className="mt-6 grid gap-6 lg:grid-cols-[260px_1fr]">
        <aside className="hidden lg:block">
          <FilterSidebar filters={filters} />
        </aside>
        <div>
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {products.length > 0
                ? `${products.length} προϊόντα`
                : "Δεν βρέθηκαν προϊόντα"}
            </p>
            <SortDropdown />
          </div>
          <ProductGrid products={products} />
          {totalPages > 1 && (
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              baseHref={`/${fullPath}`}
            />
          )}
        </div>
      </div>
    </main>
  );
}
