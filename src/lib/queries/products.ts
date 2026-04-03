import { cacheTag, cacheLife } from "next/cache";
import { createClient } from "@/lib/supabase/server";

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

function primaryImage(images: ProductImage[]): ProductImage | null {
  if (images.length === 0) return null;
  return [...images].sort((a, b) => a.position - b.position)[0] ?? null;
}

export async function getProduct(slug: string): Promise<Product | null> {
  const supabase = await createClient();

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
    .single();

  if (error || !data) return null;

  const brand = data.brands as unknown as { name: string; slug: string } | null;
  const cat = data.categories as unknown as {
    slug: string;
    name: string;
  } | null;
  const images = (data.images as unknown as ProductImage[]) ?? [];

  return {
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
}

export async function getProductsByCategory(
  options: GetProductsByCategoryOptions,
): Promise<PaginatedResult<ProductListItem>> {
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

  const supabase = await createClient();
  const offset = (page - 1) * perPage;
  const { column, ascending } = SORT_MAP[sort];

  const { data: cat } = await supabase
    .from("categories")
    .select("id")
    .eq("slug", categorySlug)
    .single();

  if (!cat) {
    return { data: [], total: 0, page, perPage, totalPages: 0 };
  }

  let query = supabase
    .from("products")
    .select(
      `id, slug, name, price, compare_at_price, stock, certification,
       rider_type, images, average_rating, review_count,
       brands ( name, slug ), categories ( slug )`,
      { count: "exact" },
    )
    .eq("category_id", cat.id)
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

  const total = count ?? 0;
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
      average_rating: row.average_rating,
      review_count: row.review_count,
    };
  });

  return {
    data: products,
    total,
    page,
    perPage,
    totalPages: Math.ceil(total / perPage),
  };
}

export async function getProductFilters(
  categorySlug: string,
): Promise<ProductFilters> {
  const supabase = await createClient();

  const { data: cat } = await supabase
    .from("categories")
    .select("id")
    .eq("slug", categorySlug)
    .single();

  if (!cat) {
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
      "price, certification, rider_type, average_rating, brands ( name, slug )",
    )
    .eq("category_id", cat.id)
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
): Promise<ProductListItem[]> {
  const supabase = await createClient();

  const { data: cat } = await supabase
    .from("categories")
    .select("id")
    .eq("slug", categorySlug)
    .single();

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

  return data.map((row) => {
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
      average_rating: row.average_rating,
      review_count: row.review_count,
    };
  });
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

  if (error || !data) return [];

  return data
    .map((row) => {
      const cat = row.categories as unknown as { slug: string } | null;
      return cat ? { category_slug: cat.slug, slug: row.slug } : null;
    })
    .filter((x): x is { category_slug: string; slug: string } => x !== null);
}
