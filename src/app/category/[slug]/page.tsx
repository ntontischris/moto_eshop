import type { Metadata } from "next";
import { notFound } from "next/navigation";
import MMShell from "@/components/mm/mm-shell";
import { getCategory, getSubcategories } from "@/lib/queries/categories";
import {
  getProductFilters,
  getProductsByCategory,
} from "@/lib/queries/products";
import { PLPContent } from "./plp-content";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://motomarket.gr";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const cat = await getCategory(slug);
  if (!cat) return { title: "Category not found" };
  return {
    title: `${cat.name} | Motomarket`,
    description:
      cat.seo_intro ??
      cat.description ??
      `${cat.name} από όλα τα κορυφαία brands.`,
    alternates: { canonical: `${BASE_URL}/category/${slug}` },
    openGraph: cat.image_url
      ? { images: [cat.image_url], type: "website" }
      : undefined,
  };
}

type SearchParams = Record<string, string | string[] | undefined>;

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<SearchParams>;
}) {
  const { slug } = await params;
  const sp = await searchParams;

  const cat = await getCategory(slug);
  if (!cat) notFound();

  const sort =
    (sp.sort as "popular" | "price_asc" | "price_desc" | "newest" | "rating") ??
    "popular";
  const brands =
    typeof sp.brands === "string" ? sp.brands.split(",") : undefined;
  const priceMin = sp.price_min ? Number(sp.price_min) : undefined;
  const priceMax = sp.price_max ? Number(sp.price_max) : undefined;
  const page = sp.page ? Number(sp.page) : 1;

  const [result, filters, subcats] = await Promise.all([
    getProductsByCategory({
      categorySlug: slug,
      page,
      perPage: 24,
      sort,
      brands,
      priceMin,
      priceMax,
    }),
    getProductFilters(slug),
    getSubcategories(slug),
  ]);

  return (
    <MMShell mode="dark">
      <PLPContent
        slug={slug}
        category={{
          name: cat.name,
          description: cat.description,
          image_url: cat.image_url,
        }}
        subcategories={subcats.map((s) => ({ slug: s.slug, name: s.name }))}
        products={result.data}
        total={result.total}
        page={result.page}
        totalPages={result.totalPages}
        filters={filters}
        initialFilters={{
          sort,
          brands: brands ?? [],
          priceMin,
          priceMax,
        }}
      />
    </MMShell>
  );
}
