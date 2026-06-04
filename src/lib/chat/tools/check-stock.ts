import { tool } from "ai";
import { z } from "zod/v4";
import { getStockForProduct } from "@/lib/erp";
import { createClient } from "@/lib/supabase/server";

export const checkStockInputSchema = z.object({
  productId: z.string().min(1),
  variantId: z.string().optional(),
});

export interface CheckStockResult {
  productId: string;
  inStock: boolean;
  totalStock: number;
  stores: Array<{ id: string; name: string; stock: number }>;
  error?: string;
}

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * The chat model knows a catalog Product id (a Supabase UUID or a slug); the
 * ERP only understands the SKU (`products.sku`). Resolve it here, at the
 * boundary, before any ERP call. Returns null when the product has no SKU.
 */
async function resolveSku(productId: string): Promise<string | null> {
  const supabase = await createClient();
  const column = UUID_RE.test(productId) ? "id" : "slug";
  const { data } = await supabase
    .from("products")
    .select("sku")
    .eq(column, productId)
    .maybeSingle();
  return data?.sku ?? null;
}

export const checkStockTool = tool({
  description:
    "Check live stock for a specific product across the two stores (Καλλιθέα, Θεσσαλονίκη) and the central warehouse. Always call this before claiming a product is in stock — catalog cache may be stale.",
  inputSchema: checkStockInputSchema,
  execute: async ({ productId, variantId }): Promise<CheckStockResult> => {
    try {
      const sku = await resolveSku(productId);
      if (!sku) {
        return {
          productId,
          inStock: false,
          totalStock: 0,
          stores: [],
          error: "Stock lookup unavailable: product has no ERP SKU",
        };
      }
      const data = await getStockForProduct({ productId: sku, variantId });
      const total = data.stores.reduce((acc, s) => acc + (s.stock ?? 0), 0);
      return {
        productId,
        inStock: total > 0,
        totalStock: total,
        stores: data.stores,
      };
    } catch (err) {
      return {
        productId,
        inStock: false,
        totalStock: 0,
        stores: [],
        error: `Stock lookup unavailable: ${(err as Error).message}`,
      };
    }
  },
});
