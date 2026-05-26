import { tool } from "ai";
import { z } from "zod/v4";
import { createClient } from "@/lib/supabase/server";

export const getProductDetailsInputSchema = z.object({
  productId: z.string().min(1).describe("Product UUID or slug"),
});

export interface ProductDetails {
  id: string;
  slug: string;
  name: string;
  brand: string;
  price: number;
  description: string | null;
  image: string | null;
  in_stock: boolean;
}

export type GetProductDetailsResult =
  | { found: true; product: ProductDetails }
  | { found: false };

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const getProductDetailsTool = tool({
  description:
    "Get full details for a single product by id or slug. Returns name, brand, price, description, image, and stock status. Use this when the user wants to know more about one specific product.",
  inputSchema: getProductDetailsInputSchema,
  execute: async ({ productId }): Promise<GetProductDetailsResult> => {
    const supabase = await createClient();
    const isUuid = UUID_RE.test(productId);

    const { data } = (await supabase
      .from("products")
      .select(
        "id, slug, name, brands(name), price, description, images, images_cdn, stock",
      )
      .eq(isUuid ? "id" : "slug", productId)
      .maybeSingle()) as { data: unknown };

    if (!data) return { found: false };

    const row = data as {
      id: string;
      slug: string;
      name: string;
      brands: { name: string } | null;
      price: number;
      description: string | null;
      images: string[] | null;
      images_cdn: string[] | null;
      stock: number | null;
    };

    // Prefer CDN images, fall back to legacy images jsonb array
    const imageSource = row.images_cdn ?? row.images ?? [];
    const firstImage = Array.isArray(imageSource)
      ? (imageSource[0] ?? null)
      : null;

    return {
      found: true,
      product: {
        id: row.id,
        slug: row.slug,
        name: row.name,
        brand: row.brands?.name ?? "",
        price: row.price,
        description: row.description,
        image: firstImage,
        in_stock: (row.stock ?? 0) > 0,
      },
    };
  },
});
