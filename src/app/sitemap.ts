import type { MetadataRoute } from "next";
import { cacheTag, cacheLife } from "next/cache";
import { createPublicClient } from "@/lib/supabase/public";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://motomarket.gr";

async function getProductEntries(): Promise<MetadataRoute.Sitemap> {
  "use cache";
  cacheTag("products");
  cacheLife("hours");

  const supabase = createPublicClient();

  const { data } = await supabase
    .from("products")
    .select("slug, updated_at, categories:category_id(slug)")
    .eq("status", "active")
    .order("updated_at", { ascending: false });

  return (data ?? []).map((product) => {
    const catSlug =
      (product.categories as unknown as { slug: string } | null)?.slug ??
      "products";
    return {
      url: `${BASE_URL}/${catSlug}/${product.slug}`,
      lastModified: new Date(product.updated_at),
      changeFrequency: "weekly" as const,
      priority: 0.8,
    };
  });
}

async function getCategoryEntries(): Promise<MetadataRoute.Sitemap> {
  "use cache";
  cacheTag("categories");
  cacheLife("days");

  const supabase = createPublicClient();

  const { data } = await supabase.from("categories").select("slug, created_at");

  return (data ?? []).map((cat) => ({
    url: `${BASE_URL}/${cat.slug}`,
    lastModified: new Date(cat.created_at),
    changeFrequency: "daily" as const,
    priority: 0.7,
  }));
}

async function getBrandEntries(): Promise<MetadataRoute.Sitemap> {
  "use cache";
  cacheTag("brands");
  cacheLife("days");

  const supabase = createPublicClient();

  const { data } = await supabase.from("brands").select("slug, created_at");

  return (data ?? []).map((brand) => ({
    url: `${BASE_URL}/brands/${brand.slug}`,
    lastModified: new Date(brand.created_at),
    changeFrequency: "weekly" as const,
    priority: 0.6,
  }));
}

const STATIC_PAGES = [
  { path: "/", priority: 1.0, changeFrequency: "daily" as const },
  { path: "/products", priority: 0.9, changeFrequency: "daily" as const },
  { path: "/about", priority: 0.4, changeFrequency: "monthly" as const },
  { path: "/contact", priority: 0.4, changeFrequency: "monthly" as const },
  { path: "/faq", priority: 0.5, changeFrequency: "monthly" as const },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [products, categories, brands] = await Promise.all([
    getProductEntries(),
    getCategoryEntries(),
    getBrandEntries(),
  ]);

  const statics: MetadataRoute.Sitemap = STATIC_PAGES.map(
    ({ path, priority, changeFrequency }) => ({
      url: `${BASE_URL}${path}`,
      lastModified: new Date(),
      changeFrequency,
      priority,
    }),
  );

  return [...statics, ...categories, ...brands, ...products];
}
