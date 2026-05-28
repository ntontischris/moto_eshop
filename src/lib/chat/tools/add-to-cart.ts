import { tool } from "ai";
import { z } from "zod/v4";
import { addToCart } from "@/lib/actions/cart";

export const addToCartInputSchema = z.object({
  productId: z.string().min(1),
  unitPrice: z.number().positive(),
  variantId: z.string().optional(),
  qty: z.number().int().min(1).max(10).optional(),
  size: z.string().optional(),
  color: z.string().optional(),
});

export interface AddToCartResult {
  success: boolean;
  cartItemCount?: number;
  message?: string;
  error?: string;
}

export const addToCartTool = tool({
  description:
    "Add a product to the user's cart on their behalf. Only call AFTER the user has explicitly agreed to add a specific product mentioned in this conversation. Returns the new cart item count.",
  inputSchema: addToCartInputSchema,
  execute: async ({
    productId,
    unitPrice,
    qty,
    size,
    color,
  }): Promise<AddToCartResult> => {
    try {
      const result = await addToCart({
        productId,
        quantity: qty ?? 1,
        unitPrice,
        size: size ?? null,
        color: color ?? null,
      });

      if (!result.success) {
        return {
          success: false,
          error: result.error,
        };
      }

      return {
        success: true,
        cartItemCount: result.data.itemCount,
        message: `Πρόσθεσα ${qty ?? 1} × στο καλάθι.`,
      };
    } catch (err) {
      return {
        success: false,
        error: (err as Error).message,
      };
    }
  },
});
