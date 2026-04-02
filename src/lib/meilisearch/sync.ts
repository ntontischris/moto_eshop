import { createAdminClient } from "@/lib/supabase/admin";
import { getAdminClient, PRODUCTS_INDEX } from "./client";
import type { SearchDocument } from "./types";

const PAGE_SIZE = 500;

interface ProductRow {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  price: number;
  compare_at_price: number | null;
  sku: string | null;
  stock: number;
  certification: string | null;
  rider_type: string | null;
  images: { url: string; alt: string; position: number }[];
  average_rating: number | null;
  review_count: number;
  created_at: string;
  updated_at: string;
  brands: { name: string; slug: string } | null;
  categories: { name: string; slug: string } | null;
}

function mapToDocument(row: ProductRow): SearchDocument {
  const sortedImages = [...(row.images ?? [])].sort(
    (a, b) => a.position - b.position,
  );
  const primaryImage = sortedImages[0];

  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    brand: row.brands?.name ?? "",
    brand_slug: row.brands?.slug ?? "",
    category_name: row.categories?.name ?? "",
    category_slug: row.categories?.slug ?? "",
    description: row.description ?? "",
    sku: row.sku ?? "",
    price: row.price,
    compare_at_price: row.compare_at_price,
    rating: row.average_rating,
    review_count: row.review_count,
    in_stock: row.stock > 0,
    stock: row.stock,
    certification: row.certification,
    rider_type: row.rider_type,
    primary_image_url: primaryImage?.url ?? "/images/placeholder-product.webp",
    primary_image_alt: primaryImage?.alt ?? row.name,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

export async function syncProducts(): Promise<{ indexed: number }> {
  const supabase = createAdminClient();
  const index = getAdminClient().index(PRODUCTS_INDEX);
  let offset = 0;
  let total = 0;

  while (true) {
    const { data, error } = await supabase
      .from("products")
      .select(
        `
        id, slug, name, description, price, compare_at_price, sku, stock,
        certification, rider_type, images, average_rating, review_count,
        created_at, updated_at,
        brands ( name, slug ),
        categories ( name, slug )
      `,
      )
      .eq("status", "active")
      .range(offset, offset + PAGE_SIZE - 1);

    if (error) throw new Error(`Supabase query failed: ${error.message}`);
    if (!data || data.length === 0) break;

    const documents = (data as unknown as ProductRow[]).map(mapToDocument);
    await index.addDocuments(documents, { primaryKey: "id" });

    total += documents.length;
    offset += PAGE_SIZE;

    if (data.length < PAGE_SIZE) break;
  }

  return { indexed: total };
}

export async function syncSingleProduct(productId: string): Promise<void> {
  const supabase = createAdminClient();
  const index = getAdminClient().index(PRODUCTS_INDEX);

  const { data, error } = await supabase
    .from("products")
    .select(
      `
      id, slug, name, description, price, compare_at_price, sku, stock,
      certification, rider_type, images, average_rating, review_count,
      created_at, updated_at,
      brands ( name, slug ),
      categories ( name, slug )
    `,
    )
    .eq("id", productId)
    .single();

  if (error) throw new Error(`Supabase query failed: ${error.message}`);
  if (!data) return;

  await index.addDocuments([mapToDocument(data as unknown as ProductRow)], {
    primaryKey: "id",
  });
}

export async function deleteProductFromIndex(productId: string): Promise<void> {
  const index = getAdminClient().index(PRODUCTS_INDEX);
  await index.deleteDocument(productId);
}
