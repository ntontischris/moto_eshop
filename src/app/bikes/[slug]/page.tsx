import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { getCompatibleProductIds } from "@/lib/queries/compatibility";
import { ProductGrid } from "@/components/product/product-grid";
import type { ProductListItem } from "@/lib/queries/products";

interface BikePageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ year?: string }>;
}

function parseSlug(slug: string): { make: string; model: string } | null {
  const decoded = decodeURIComponent(slug);
  const dashIndex = decoded.indexOf("-");
  if (dashIndex === -1) return null;
  const make = decoded.slice(0, dashIndex);
  const model = decoded.slice(dashIndex + 1).replace(/-/g, " ");
  return { make, model };
}

export async function generateMetadata({
  params,
  searchParams,
}: BikePageProps): Promise<Metadata> {
  const { slug } = await params;
  const { year } = await searchParams;
  const parsed = parseSlug(slug);
  if (!parsed) return {};

  return {
    title: `Εξαρτήματα για ${parsed.make} ${parsed.model}${year ? ` ${year}` : ""} | MotoMarket`,
    description: `Βρες συμβατά εξαρτήματα και αξεσουάρ για ${parsed.make} ${parsed.model}.`,
  };
}

export default async function BikeProductsPage({
  params,
  searchParams,
}: BikePageProps) {
  const { slug } = await params;
  const { year } = await searchParams;
  const parsed = parseSlug(slug);
  if (!parsed) notFound();

  const supabase = await createClient();

  let bikeQuery = supabase
    .from("bikes")
    .select("id, make, model, year")
    .ilike("make", parsed.make)
    .ilike("model", `%${parsed.model}%`);

  if (year) bikeQuery = bikeQuery.eq("year", Number(year));

  const { data: bike } = await bikeQuery.limit(1).maybeSingle();
  if (!bike) notFound();

  const compatibleIds = await getCompatibleProductIds(bike.id);

  let products: ProductListItem[] = [];

  if (compatibleIds.length > 0) {
    const { data } = await supabase
      .from("products")
      .select(
        `
        id, slug, name, price, compare_at_price, stock, certification,
        rider_type, images, average_rating, review_count,
        brands ( name, slug ), categories ( slug )
      `,
      )
      .in("id", compatibleIds)
      .eq("status", "active")
      .order("name")
      .limit(100);

    products = (data ?? []).map((row) => {
      const brand = row.brands as unknown as {
        name: string;
        slug: string;
      } | null;
      const cat = row.categories as unknown as { slug: string } | null;
      const imgs =
        (row.images as unknown as {
          url: string;
          alt: string;
          position: number;
        }[]) ?? [];
      const sorted = [...imgs].sort((a, b) => a.position - b.position);
      const img = sorted[0];

      return {
        id: row.id,
        slug: row.slug,
        name: row.name,
        brand: brand?.name ?? "",
        brand_slug: brand?.slug ?? "",
        price: row.price,
        compare_at_price: row.compare_at_price,
        category_slug: cat?.slug ?? "",
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

  return (
    <main className="container mx-auto px-4 py-10">
      <h1 className="mb-2 text-3xl font-bold">
        Εξαρτήματα για {bike.make} {bike.model} {bike.year}
      </h1>
      <p className="mb-8 text-muted-foreground">
        {products.length} συμβατά προϊόντα
      </p>
      <ProductGrid products={products} />
    </main>
  );
}
