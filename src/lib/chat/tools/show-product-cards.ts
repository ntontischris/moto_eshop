import { tool } from "ai";
import { z } from "zod/v4";
import { createClient } from "@/lib/supabase/server";

export const showProductCardsInputSchema = z.object({
  productIds: z
    .array(z.string().min(1))
    .min(1)
    .max(6)
    .describe("Up to 6 product UUIDs or slugs to display as cards"),
});

export interface ChatProductSummary {
  id: string;
  slug: string;
  name: string;
  brand: string;
  price: number;
  image: string | null;
  in_stock: boolean;
}

export interface ShowProductCardsResult {
  products: ChatProductSummary[];
  notFound: string[];
}

type ProductRow = {
  id: string;
  slug: string;
  name: string;
  price: number;
  images: unknown;
  images_cdn: unknown;
  stock: number | null;
  brands: { name: string } | null;
};

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function pickImage(images: unknown, cdn: unknown): string | null {
  if (Array.isArray(cdn) && cdn.length > 0 && typeof cdn[0] === "string")
    return cdn[0];
  if (
    Array.isArray(images) &&
    images.length > 0 &&
    typeof images[0] === "string"
  )
    return images[0];
  return null;
}

const SELECT = "id, slug, name, price, images, images_cdn, stock, brands(name)";

export const showProductCardsTool = tool({
  description:
    "Render product cards inline in the chat so the user sees real products with images and prices. Pass 1–6 product IDs or slugs. Always prefer this over plain text links when introducing products.",
  inputSchema: showProductCardsInputSchema,
  execute: async ({ productIds }): Promise<ShowProductCardsResult> => {
    const supabase = await createClient();

    const uuids = productIds.filter((id) => UUID_RE.test(id));
    const slugs = productIds.filter((id) => !UUID_RE.test(id));

    const fetched: ProductRow[] = [];

    if (uuids.length > 0) {
      const { data } = (await supabase
        .from("products")
        .select(SELECT)
        .in("id", uuids)
        .limit(6)) as { data: unknown };
      if (Array.isArray(data)) fetched.push(...(data as ProductRow[]));
    }

    if (slugs.length > 0) {
      const { data } = (await supabase
        .from("products")
        .select(SELECT)
        .in("slug", slugs)
        .limit(6)) as { data: unknown };
      if (Array.isArray(data)) fetched.push(...(data as ProductRow[]));
    }

    const seen = new Set<string>();
    for (const p of fetched) {
      seen.add(p.id);
      seen.add(p.slug);
    }

    const notFound = productIds.filter((pid) => !seen.has(pid));

    return {
      products: fetched.map((p) => ({
        id: p.id,
        slug: p.slug,
        name: p.name,
        brand: p.brands?.name ?? "",
        price: p.price,
        image: pickImage(p.images, p.images_cdn),
        in_stock: (p.stock ?? 0) > 0,
      })),
      notFound,
    };
  },
});
