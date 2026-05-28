import { cacheTag, cacheLife } from "next/cache";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import type { Locale } from "@/i18n/config";
import type { Database } from "@/types/database";

/**
 * Overlay a translation onto a source row. Falls back to the source value
 * whenever a translated field is null/missing, so a partial translation
 * never blanks out a name or description.
 */
export function applyTranslation<
  T extends { name: string; description?: string | null },
>(
  base: T,
  tr: { name?: string | null; description?: string | null } | undefined | null,
): T {
  if (!tr) return base;
  return {
    ...base,
    name: tr.name ?? base.name,
    description: tr.description ?? base.description ?? null,
  };
}

export interface ProductImage {
  url: string;
  alt: string;
  position: number;
}

export interface Product {
  id: string;
  slug: string;
  name: string;
  brand: string;
  brand_slug: string;
  description: string | null;
  price: number;
  compare_at_price: number | null;
  category_slug: string;
  category_name: string;
  sku: string | null;
  stock: number;
  certification: string | null;
  rider_type: string | null;
  specs: Record<string, string>;
  images: ProductImage[];
  view_count: number;
  average_rating: number | null;
  review_count: number;
  created_at: string;
}

export interface ProductListItem {
  id: string;
  slug: string;
  name: string;
  brand: string;
  brand_slug: string;
  price: number;
  compare_at_price: number | null;
  category_slug: string;
  stock: number;
  certification: string | null;
  rider_type: string | null;
  primary_image_url: string;
  primary_image_alt: string;
  secondary_image_url?: string | null;
  gallery_image_urls?: string[];
  average_rating: number | null;
  review_count: number;
}

export interface ProductFilters {
  brands: { slug: string; name: string; count: number }[];
  price_range: { min: number; max: number };
  certifications: { value: string; count: number }[];
  rider_types: { value: string; count: number }[];
  rating_buckets: { min: number; count: number }[];
}

export type SortOption =
  | "popular"
  | "price_asc"
  | "price_desc"
  | "newest"
  | "rating";

export interface GetProductsByCategoryOptions {
  categorySlug: string;
  page?: number;
  perPage?: number;
  sort?: SortOption;
  brands?: string[];
  priceMin?: number;
  priceMax?: number;
  certifications?: string[];
  riderTypes?: string[];
  minRating?: number;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
}

const SORT_MAP: Record<SortOption, { column: string; ascending: boolean }> = {
  popular: { column: "view_count", ascending: false },
  price_asc: { column: "price", ascending: true },
  price_desc: { column: "price", ascending: false },
  newest: { column: "created_at", ascending: false },
  rating: { column: "average_rating", ascending: false },
};

/**
 * Best-effort: fetch translated names for a batch of products and overlay them
 * onto list items by id. A missing table or error leaves the source names in
 * place. List items only carry `name` (no description), so only `name` is
 * overlaid.
 */
async function overlayListNames(
  supabase: SupabaseClient<Database>,
  items: ProductListItem[],
  locale: Locale,
): Promise<ProductListItem[]> {
  if (locale === "en" || items.length === 0) return items;
  const ids = items.map((p) => p.id);
  const { data: trs, error } = await supabase
    .from("product_translations")
    .select("product_id,name")
    .in("product_id", ids)
    .eq("locale", locale);
  if (error || !trs) return items;
  const byId = new Map(trs.map((t) => [t.product_id, t.name]));
  return items.map((p) => {
    const name = byId.get(p.id);
    return name ? { ...p, name } : p;
  });
}

function primaryImage(images: ProductImage[]): ProductImage | null {
  if (images.length === 0) return null;
  return [...images].sort((a, b) => a.position - b.position)[0] ?? null;
}

// Second image (by position) powers the on-hover swap in product cards.
// Null when a product has only one shot — the card falls back to a zoom.
function secondaryImage(images: ProductImage[]): ProductImage | null {
  if (images.length < 2) return null;
  return [...images].sort((a, b) => a.position - b.position)[1] ?? null;
}

// All image URLs (by position), capped — powers the on-hover image cycle
// on landing product cards. Capped to keep the RSC payload bounded.
function galleryUrls(images: ProductImage[], cap = 6): string[] {
  return [...images]
    .sort((a, b) => a.position - b.position)
    .map((img) => img.url)
    .filter(Boolean)
    .slice(0, cap);
}

/**
 * Resolve a category slug to its full_path so callers can filter products
 * across the whole branch via an inner join on categories.full_path.
 *
 * Products only live on leaf categories, so non-leaf PLPs need a branch
 * filter — otherwise root/mid-level pages render empty. Filtering on the
 * joined full_path keeps the URL short even for trees with hundreds of
 * descendants (e.g. my-bike has 811 children).
 */
async function resolveCategoryPath(
  supabase: Awaited<ReturnType<typeof createClient>>,
  categorySlug: string,
): Promise<string | null> {
  const { data: cat } = await supabase
    .from("categories")
    .select("full_path")
    .eq("slug", categorySlug)
    .maybeSingle();
  return cat?.full_path ?? null;
}

export async function getProduct(
  slug: string,
  locale: Locale = "el",
): Promise<Product | null> {
  "use cache";
  cacheTag(`product:v3:${slug}:${locale}`);
  cacheTag("products");
  cacheLife("hours");
  const { createAdminClient } = await import("@/lib/supabase/admin");
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("products")
    .select(
      `
      id, slug, name, description, price, compare_at_price,
      sku, stock, certification, rider_type, specs, images,
      view_count, average_rating, review_count, created_at,
      brands ( name, slug ),
      categories ( slug, name )
    `,
    )
    .eq("slug", slug)
    .eq("status", "active")
    .maybeSingle();

  // A transient Supabase error must NOT be cached as a permanent 404. Throwing
  // keeps "use cache" from storing the failure, so the next request retries
  // cleanly; only a genuine "no row" (no error) caches as not-found.
  if (error) throw new Error(`getProduct(${slug}): ${error.message}`);
  if (!data) return null;

  const brand = data.brands as unknown as { name: string; slug: string } | null;
  const cat = data.categories as unknown as {
    slug: string;
    name: string;
  } | null;
  // Images can be either string[] (from ERP scraper) or ProductImage[] (legacy/admin).
  // Normalize to ProductImage[] so the UI never has to branch.
  // Also: route legacy eshop images through our proxy because the origin
  // blocks Next.js Image Optimizer's User-Agent with 403.
  function proxyIfLegacy(url: string): string {
    if (
      url.startsWith("https://www.motomarket-shop.gr/") ||
      url.startsWith("https://motomarket-shop.gr/")
    ) {
      return `/api/image-proxy?url=${encodeURIComponent(url)}`;
    }
    return url;
  }
  const rawImages = (data.images as unknown[]) ?? [];
  const images: ProductImage[] = rawImages.map((img, idx) => {
    if (typeof img === "string") {
      return { url: proxyIfLegacy(img), alt: data.name ?? "", position: idx };
    }
    const obj = img as Partial<ProductImage>;
    return {
      url: proxyIfLegacy(obj.url ?? ""),
      alt: obj.alt ?? data.name ?? "",
      position: obj.position ?? idx,
    };
  });

  const product: Product = {
    id: data.id,
    slug: data.slug,
    name: data.name,
    brand: brand?.name ?? "",
    brand_slug: brand?.slug ?? "",
    description: data.description,
    price: data.price,
    compare_at_price: data.compare_at_price,
    category_slug: cat?.slug ?? "",
    category_name: cat?.name ?? "",
    sku: data.sku,
    stock: data.stock,
    certification: data.certification,
    rider_type: data.rider_type,
    specs: (data.specs as unknown as Record<string, string>) ?? {},
    images: images.sort((a, b) => a.position - b.position),
    view_count: data.view_count,
    average_rating: data.average_rating,
    review_count: data.review_count,
    created_at: data.created_at,
  };

  if (locale === "en") return product;

  // The catalog source text in the DB is English, so `en` reads pass through
  // above. Every other locale (incl. el) overlays translations; a missing table
  // or empty result falls back to the English source so the page never blocks.
  const { data: tr } = await supabase
    .from("product_translations")
    .select("name,description")
    .eq("product_id", data.id)
    .eq("locale", locale)
    .maybeSingle();

  return applyTranslation(product, tr);
}

export async function getProductsByCategory(
  options: GetProductsByCategoryOptions,
  locale: Locale = "el",
): Promise<PaginatedResult<ProductListItem>> {
  "use cache";
  cacheTag(`category-products:${options.categorySlug}:${locale}`);
  cacheTag("products");
  cacheLife("hours");
  const {
    categorySlug,
    page = 1,
    perPage = 24,
    sort = "popular",
    brands,
    priceMin,
    priceMax,
    certifications,
    riderTypes,
    minRating,
  } = options;

  const { createAdminClient } = await import("@/lib/supabase/admin");
  const supabase = createAdminClient();
  const offset = (page - 1) * perPage;
  const { column, ascending } = SORT_MAP[sort];

  const fullPath = await resolveCategoryPath(supabase, categorySlug);

  if (!fullPath) {
    return { data: [], total: 0, page, perPage, totalPages: 0 };
  }

  let query = supabase
    .from("products")
    .select(
      `id, slug, name, price, compare_at_price, stock, certification,
       rider_type, images, average_rating, review_count,
       brands ( name, slug ), categories!inner ( slug, full_path )`,
      { count: "exact" },
    )
    .or(`full_path.eq.${fullPath},full_path.like.${fullPath}/*`, {
      referencedTable: "categories",
    })
    .eq("status", "active")
    .order(column, { ascending })
    .range(offset, offset + perPage - 1);

  if (brands && brands.length > 0) {
    const { data: brandRows } = await supabase
      .from("brands")
      .select("id")
      .in("slug", brands);
    const brandIds = (brandRows ?? []).map((b) => b.id);
    if (brandIds.length > 0) {
      query = query.in("brand_id", brandIds);
    }
  }

  if (priceMin !== undefined) query = query.gte("price", priceMin);
  if (priceMax !== undefined) query = query.lte("price", priceMax);
  if (certifications && certifications.length > 0)
    query = query.in("certification", certifications);
  if (riderTypes && riderTypes.length > 0)
    query = query.in(
      "rider_type",
      riderTypes as (
        | "beginner"
        | "intermediate"
        | "advanced"
        | "professional"
      )[],
    );
  if (minRating !== undefined) query = query.gte("average_rating", minRating);

  const { data, error, count } = await query;

  if (error) {
    console.error("[getProductsByCategory]", error.message);
    return { data: [], total: 0, page, perPage, totalPages: 0 };
  }

  // .or() with referencedTable can make PostgREST omit the exact count;
  // fall back to the page rows so the label/grid never read as empty.
  const total = typeof count === "number" ? count : (data?.length ?? 0);
  const products: ProductListItem[] = (data ?? []).map((row) => {
    const brand = row.brands as unknown as {
      name: string;
      slug: string;
    } | null;
    const c = row.categories as unknown as { slug: string } | null;
    const imgs = (row.images as unknown as ProductImage[]) ?? [];
    const img = primaryImage(imgs);

    return {
      id: row.id,
      slug: row.slug,
      name: row.name,
      brand: brand?.name ?? "",
      brand_slug: brand?.slug ?? "",
      price: row.price,
      compare_at_price: row.compare_at_price,
      category_slug: c?.slug ?? categorySlug,
      stock: row.stock,
      certification: row.certification,
      rider_type: row.rider_type,
      primary_image_url: img?.url ?? "/images/placeholder-product.webp",
      primary_image_alt: img?.alt ?? row.name,
      secondary_image_url: secondaryImage(imgs)?.url ?? null,
      gallery_image_urls: galleryUrls(imgs),
      average_rating: row.average_rating,
      review_count: row.review_count,
    };
  });

  return {
    data: await overlayListNames(supabase, products, locale),
    total,
    page,
    perPage,
    totalPages: Math.ceil(total / perPage),
  };
}

export async function searchProducts(
  q: string,
  page = 1,
  perPage = 24,
  locale: Locale = "el",
): Promise<PaginatedResult<ProductListItem>> {
  const term = q.trim();
  if (term.length < 2) {
    return { data: [], total: 0, page, perPage, totalPages: 0 };
  }
  const { createAdminClient } = await import("@/lib/supabase/admin");
  const supabase = createAdminClient();
  const offset = (page - 1) * perPage;
  const safe = term.replace(/[%_,*()]/g, " ");
  // Builder .ilike() uses SQL "%" wildcards…
  const like = `%${safe}%`;
  // …but the PostgREST .or() string uses "*" wildcards instead.
  const orLike = `*${safe}*`;

  // Match product name OR a brand whose name matches the term.
  const { data: brandRows } = await supabase
    .from("brands")
    .select("id")
    .ilike("name", like);
  const brandIds = (brandRows ?? []).map((b) => b.id);
  const orFilter =
    brandIds.length > 0
      ? `name.ilike.${orLike},brand_id.in.(${brandIds.join(",")})`
      : `name.ilike.${orLike}`;

  const { data, error, count } = await supabase
    .from("products")
    .select(
      `id, slug, name, price, compare_at_price, stock, certification,
       rider_type, images, average_rating, review_count,
       brands ( name, slug ), categories ( slug )`,
      { count: "exact" },
    )
    .eq("status", "active")
    .or(orFilter)
    .order("view_count", { ascending: false })
    .range(offset, offset + perPage - 1);

  if (error) {
    console.error("[searchProducts]", error.message);
    return { data: [], total: 0, page, perPage, totalPages: 0 };
  }

  // .or() + embedded selects can make PostgREST omit the exact count;
  // fall back to the rows we got so results still render.
  const total = typeof count === "number" ? count : (data?.length ?? 0);
  const products: ProductListItem[] = (data ?? []).map((row) => {
    const brand = row.brands as unknown as {
      name: string;
      slug: string;
    } | null;
    const c = row.categories as unknown as { slug: string } | null;
    const imgs = (row.images as unknown as ProductImage[]) ?? [];
    const img = primaryImage(imgs);
    return {
      id: row.id,
      slug: row.slug,
      name: row.name,
      brand: brand?.name ?? "",
      brand_slug: brand?.slug ?? "",
      price: row.price,
      compare_at_price: row.compare_at_price,
      category_slug: c?.slug ?? "",
      stock: row.stock,
      certification: row.certification,
      rider_type: row.rider_type,
      primary_image_url: img?.url ?? "/images/placeholder-product.webp",
      primary_image_alt: img?.alt ?? row.name,
      secondary_image_url: secondaryImage(imgs)?.url ?? null,
      gallery_image_urls: galleryUrls(imgs),
      average_rating: row.average_rating,
      review_count: row.review_count,
    };
  });

  return {
    data: await overlayListNames(supabase, products, locale),
    total,
    page,
    perPage,
    totalPages: Math.ceil(total / perPage),
  };
}

export async function getProductFilters(
  categorySlug: string,
): Promise<ProductFilters> {
  "use cache";
  cacheTag("products");
  cacheLife("hours");
  const { createAdminClient } = await import("@/lib/supabase/admin");
  const supabase = createAdminClient();

  const fullPath = await resolveCategoryPath(supabase, categorySlug);

  if (!fullPath) {
    return {
      brands: [],
      price_range: { min: 0, max: 0 },
      certifications: [],
      rider_types: [],
      rating_buckets: [],
    };
  }

  const { data, error } = await supabase
    .from("products")
    .select(
      "price, certification, rider_type, average_rating, brands ( name, slug ), categories!inner ( full_path )",
    )
    .or(`full_path.eq.${fullPath},full_path.like.${fullPath}/*`, {
      referencedTable: "categories",
    })
    .eq("status", "active");

  if (error || !data) {
    return {
      brands: [],
      price_range: { min: 0, max: 0 },
      certifications: [],
      rider_types: [],
      rating_buckets: [],
    };
  }

  const brandMap = new Map<string, { name: string; count: number }>();
  const certMap = new Map<string, number>();
  const riderMap = new Map<string, number>();
  let minPrice = Infinity;
  let maxPrice = -Infinity;
  const ratingCounts = new Map<number, number>();

  for (const row of data) {
    const brand = row.brands as unknown as {
      name: string;
      slug: string;
    } | null;
    if (brand) {
      const entry = brandMap.get(brand.slug);
      if (entry) {
        entry.count += 1;
      } else {
        brandMap.set(brand.slug, { name: brand.name, count: 1 });
      }
    }

    if (row.price < minPrice) minPrice = row.price;
    if (row.price > maxPrice) maxPrice = row.price;

    if (row.certification) {
      certMap.set(row.certification, (certMap.get(row.certification) ?? 0) + 1);
    }

    if (row.rider_type) {
      riderMap.set(row.rider_type, (riderMap.get(row.rider_type) ?? 0) + 1);
    }

    if (row.average_rating !== null) {
      for (const threshold of [4, 3, 2]) {
        if (row.average_rating >= threshold) {
          ratingCounts.set(threshold, (ratingCounts.get(threshold) ?? 0) + 1);
        }
      }
    }
  }

  return {
    brands: Array.from(brandMap.entries())
      .map(([slug, { name, count }]) => ({ slug, name, count }))
      .sort((a, b) => b.count - a.count),
    price_range: {
      min: minPrice === Infinity ? 0 : minPrice,
      max: maxPrice === -Infinity ? 0 : maxPrice,
    },
    certifications: Array.from(certMap.entries())
      .map(([value, count]) => ({ value, count }))
      .sort((a, b) => b.count - a.count),
    rider_types: Array.from(riderMap.entries())
      .map(([value, count]) => ({ value, count }))
      .sort((a, b) => b.count - a.count),
    rating_buckets: Array.from(ratingCounts.entries())
      .map(([min, count]) => ({ min, count }))
      .sort((a, b) => b.min - a.min),
  };
}

export async function getRelatedProducts(
  productId: string,
  categorySlug: string,
  limit = 8,
  locale: Locale = "el",
): Promise<ProductListItem[]> {
  "use cache";
  cacheTag(`related:${productId}:${locale}`);
  cacheTag("products");
  cacheLife("hours");
  const { createAdminClient } = await import("@/lib/supabase/admin");
  const supabase = createAdminClient();

  const { data: cat } = await supabase
    .from("categories")
    .select("id")
    .eq("slug", categorySlug)
    .maybeSingle();

  if (!cat) return [];

  const { data, error } = await supabase
    .from("products")
    .select(
      `
      id, slug, name, price, compare_at_price, stock, certification,
      rider_type, images, average_rating, review_count,
      brands ( name, slug ), categories ( slug )
    `,
    )
    .eq("category_id", cat.id)
    .eq("status", "active")
    .neq("id", productId)
    .order("view_count", { ascending: false })
    .limit(limit);

  if (error || !data) return [];

  const items: ProductListItem[] = data.map((row) => {
    const brand = row.brands as unknown as {
      name: string;
      slug: string;
    } | null;
    const c = row.categories as unknown as { slug: string } | null;
    const imgs = (row.images as unknown as ProductImage[]) ?? [];
    const img = primaryImage(imgs);

    return {
      id: row.id,
      slug: row.slug,
      name: row.name,
      brand: brand?.name ?? "",
      brand_slug: brand?.slug ?? "",
      price: row.price,
      compare_at_price: row.compare_at_price,
      category_slug: c?.slug ?? categorySlug,
      stock: row.stock,
      certification: row.certification,
      rider_type: row.rider_type,
      primary_image_url: img?.url ?? "/images/placeholder-product.webp",
      primary_image_alt: img?.alt ?? row.name,
      secondary_image_url: secondaryImage(imgs)?.url ?? null,
      gallery_image_urls: galleryUrls(imgs),
      average_rating: row.average_rating,
      review_count: row.review_count,
    };
  });

  return overlayListNames(supabase, items, locale);
}

/**
 * Fetch active products by an explicit list of ids, preserving the order in
 * which the ids were given (used by campaign productRail manual selections).
 */
export async function getProductsByIds(
  ids: string[],
  locale: Locale = "el",
): Promise<ProductListItem[]> {
  "use cache";
  cacheTag("products");
  cacheLife("hours");
  if (ids.length === 0) return [];

  const { createAdminClient } = await import("@/lib/supabase/admin");
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("products")
    .select(
      `
      id, slug, name, price, compare_at_price, stock, certification,
      rider_type, images, average_rating, review_count,
      brands ( name, slug ), categories ( slug )
    `,
    )
    .in("id", ids)
    .eq("status", "active");

  if (error || !data) return [];

  const items: ProductListItem[] = data.map((row) => {
    const brand = row.brands as unknown as {
      name: string;
      slug: string;
    } | null;
    const c = row.categories as unknown as { slug: string } | null;
    const imgs = (row.images as unknown as ProductImage[]) ?? [];
    const img = primaryImage(imgs);

    return {
      id: row.id,
      slug: row.slug,
      name: row.name,
      brand: brand?.name ?? "",
      brand_slug: brand?.slug ?? "",
      price: row.price,
      compare_at_price: row.compare_at_price,
      category_slug: c?.slug ?? "",
      stock: row.stock,
      certification: row.certification,
      rider_type: row.rider_type,
      primary_image_url: img?.url ?? "/images/placeholder-product.webp",
      primary_image_alt: img?.alt ?? row.name,
      secondary_image_url: secondaryImage(imgs)?.url ?? null,
      gallery_image_urls: galleryUrls(imgs),
      average_rating: row.average_rating,
      review_count: row.review_count,
    };
  });

  const order = new Map(ids.map((id, i) => [id, i]));
  items.sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0));

  return overlayListNames(supabase, items, locale);
}

/**
 * Fetch active products for a brand slug, most-viewed first (campaign
 * productRail auto source `by: "brand"`).
 */
export async function getProductsByBrand(
  brandSlug: string,
  limit = 8,
  locale: Locale = "el",
): Promise<ProductListItem[]> {
  "use cache";
  cacheTag("products");
  cacheLife("hours");

  const { createAdminClient } = await import("@/lib/supabase/admin");
  const supabase = createAdminClient();

  const { data: brand } = await supabase
    .from("brands")
    .select("id")
    .eq("slug", brandSlug)
    .maybeSingle();
  if (!brand) return [];

  const { data, error } = await supabase
    .from("products")
    .select(
      `
      id, slug, name, price, compare_at_price, stock, certification,
      rider_type, images, average_rating, review_count,
      brands ( name, slug ), categories ( slug )
    `,
    )
    .eq("brand_id", brand.id)
    .eq("status", "active")
    .order("view_count", { ascending: false })
    .limit(limit);

  if (error || !data) return [];

  const items: ProductListItem[] = data.map((row) => {
    const b = row.brands as unknown as { name: string; slug: string } | null;
    const c = row.categories as unknown as { slug: string } | null;
    const imgs = (row.images as unknown as ProductImage[]) ?? [];
    const img = primaryImage(imgs);

    return {
      id: row.id,
      slug: row.slug,
      name: row.name,
      brand: b?.name ?? "",
      brand_slug: b?.slug ?? "",
      price: row.price,
      compare_at_price: row.compare_at_price,
      category_slug: c?.slug ?? "",
      stock: row.stock,
      certification: row.certification,
      rider_type: row.rider_type,
      primary_image_url: img?.url ?? "/images/placeholder-product.webp",
      primary_image_alt: img?.alt ?? row.name,
      secondary_image_url: secondaryImage(imgs)?.url ?? null,
      gallery_image_urls: galleryUrls(imgs),
      average_rating: row.average_rating,
      review_count: row.review_count,
    };
  });

  return overlayListNames(supabase, items, locale);
}

export async function getPopularProductSlugs(
  limit = 200,
): Promise<{ category_slug: string; slug: string }[]> {
  "use cache";
  cacheTag("products");
  cacheLife("days");

  const { createAdminClient } = await import("@/lib/supabase/admin");
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("products")
    .select("slug, categories ( slug )")
    .eq("status", "active")
    .order("view_count", { ascending: false })
    .limit(limit);

  // Fallback category slug for products not yet mapped to a real category.
  // Real category resolution happens at the page level; this only seeds
  // generateStaticParams so Next.js 16 Cache Components has a non-empty list.
  const FALLBACK = "eksoplismos";
  const out =
    error || !data
      ? []
      : data.map((row) => {
          const cat = row.categories as unknown as { slug: string } | null;
          return {
            category_slug: cat?.slug ?? FALLBACK,
            slug: row.slug,
          };
        });

  // Next.js 16 Cache Components requires at least one entry.
  if (out.length === 0) {
    return [{ category_slug: FALLBACK, slug: "__placeholder__" }];
  }
  return out;
}
