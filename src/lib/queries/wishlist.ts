import { createClient } from "@/lib/supabase/server";
import type { ProductListItem } from "@/lib/queries/products";

export interface WishlistItem {
  id: string;
  product_id: string;
  created_at: string;
  product: ProductListItem;
}

export async function getUserWishlist(userId: string): Promise<WishlistItem[]> {
  const supabase = await createClient();

  const { data } = await supabase
    .from("wishlists")
    .select(
      `
      id, product_id, created_at,
      products (
        id, slug, name, price, compare_at_price, stock, certification,
        rider_type, images, average_rating, review_count,
        brands ( name, slug ), categories ( slug )
      )
    `,
    )
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (!data) return [];

  return data.map((item) => {
    const p = item.products as unknown as {
      id: string;
      slug: string;
      name: string;
      price: number;
      compare_at_price: number | null;
      stock: number;
      certification: string | null;
      rider_type: string | null;
      images: { url: string; alt: string; position: number }[];
      average_rating: number | null;
      review_count: number;
      brands: { name: string; slug: string } | null;
      categories: { slug: string } | null;
    };
    const sorted = [...(p.images ?? [])].sort(
      (a, b) => a.position - b.position,
    );
    const img = sorted[0];

    return {
      id: item.id,
      product_id: item.product_id,
      created_at: item.created_at,
      product: {
        id: p.id,
        slug: p.slug,
        name: p.name,
        brand: p.brands?.name ?? "",
        brand_slug: p.brands?.slug ?? "",
        price: p.price,
        compare_at_price: p.compare_at_price,
        category_slug: p.categories?.slug ?? "",
        stock: p.stock,
        certification: p.certification,
        rider_type: p.rider_type,
        primary_image_url: img?.url ?? "/images/placeholder-product.webp",
        primary_image_alt: img?.alt ?? p.name,
        average_rating: p.average_rating,
        review_count: p.review_count,
      },
    };
  });
}

export async function isWishlisted(
  userId: string,
  productId: string,
): Promise<boolean> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("wishlists")
    .select("id")
    .eq("user_id", userId)
    .eq("product_id", productId)
    .maybeSingle();

  return data !== null;
}
