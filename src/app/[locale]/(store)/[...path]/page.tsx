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
import { buildAlternates } from "@/i18n/metadata";

import { getProduct, getPopularProductSlugs } from "@/lib/queries/products";
import { getCategoryByPath } from "@/lib/queries/categories";
import { createClient } from "@/lib/supabase/server";

import { ProductView } from "@/app/[locale]/(store)/_components/pdp/product-view";
import { CategoryView } from "@/app/[locale]/(store)/_components/plp/category-view";

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
  | {
      kind: "category";
      categoryId: string;
      categorySlug: string;
      fullPath: string;
    }
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
    return {
      kind: "category",
      categoryId: category.id,
      categorySlug: category.slug,
      fullPath,
    };
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
      alternates: buildAlternates(
        locale,
        `/${resolved.canonicalPath.join("/")}`,
      ),
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
      alternates: buildAlternates(locale, `/${resolved.fullPath}`),
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
    return <ProductView slug={resolved.productSlug} locale={locale} />;
  }

  // category
  return (
    <CategoryView
      slug={resolved.categorySlug}
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
