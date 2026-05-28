import { tool } from "ai";
import { z } from "zod/v4";
import { getStockForProduct } from "@/lib/erp";

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

export const checkStockTool = tool({
  description:
    "Check live stock for a specific product across the two stores (Καλλιθέα, Θεσσαλονίκη) and the central warehouse. Always call this before claiming a product is in stock — catalog cache may be stale.",
  inputSchema: checkStockInputSchema,
  execute: async ({ productId, variantId }): Promise<CheckStockResult> => {
    try {
      const data = await getStockForProduct({ productId, variantId });
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
