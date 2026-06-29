import { tool } from "ai";
import { z } from "zod/v4";
import { getStockForProduct, isErpLiveStockEnabled } from "@/lib/erp";
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

type StockStore = { id: string; name: string; stock: number };

const STORES: ReadonlyArray<{ code: string; name: string }> = [
  { code: "sindos", name: "Σίνδος" },
  { code: "benizelou", name: "Βενιζέλου" },
  { code: "antistaseos", name: "Αντιστάσεως" },
  { code: "beinoglou", name: "Μπεϊνόγλου" },
];

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * The chat model knows a catalog Product id (a Supabase UUID or a slug); the
 * ERP only understands the SKU (`products.sku`). Resolve both here, at the
 * boundary. Returns null when the product is unknown or has no SKU.
 */
async function resolveProduct(
  productId: string,
): Promise<{ id: string; sku: string | null } | null> {
  const supabase = await createClient();
  const column = UUID_RE.test(productId) ? "id" : "slug";
  const { data } = await supabase
    .from("products")
    .select("id, sku")
    .eq(column, productId)
    .maybeSingle();
  return data ?? null;
}

/**
 * Per-store stock from the synced snapshot (product_stock_locations) — no live
 * ERP call. Used unless ERP_LIVE_STOCK=true, so dev never burdens Entersoft.
 */
async function stockFromSnapshot(
  productUuid: string,
  variantId?: string,
): Promise<StockStore[]> {
  const supabase = await createClient();
  let query = supabase
    .from("product_stock_locations")
    .select("warehouse_code, available")
    .eq("product_id", productUuid);
  if (variantId) query = query.eq("size", variantId);
  const { data } = await query;

  const totals = new Map<string, number>();
  for (const row of data ?? []) {
    const prev = totals.get(row.warehouse_code) ?? 0;
    totals.set(row.warehouse_code, prev + (Number(row.available) || 0));
  }
  return STORES.map((s) => ({
    id: s.code,
    name: s.name,
    stock: totals.get(s.code) ?? 0,
  }));
}

export const checkStockTool = tool({
  description:
    "Check stock for a specific product across the two stores (Καλλιθέα, Θεσσαλονίκη) and the central warehouse. Always call this before claiming a product is in stock — catalog cache may be stale.",
  inputSchema: checkStockInputSchema,
  execute: async ({ productId, variantId }): Promise<CheckStockResult> => {
    try {
      const product = await resolveProduct(productId);
      if (!product?.sku) {
        return {
          productId,
          inStock: false,
          totalStock: 0,
          stores: [],
          error: "Stock lookup unavailable: product has no ERP SKU",
        };
      }
      // Default: read the synced snapshot (no live ERP). Only hit Entersoft
      // when explicitly enabled via ERP_LIVE_STOCK.
      const stores = isErpLiveStockEnabled()
        ? (await getStockForProduct({ productId: product.sku, variantId }))
            .stores
        : await stockFromSnapshot(product.id, variantId);
      const total = stores.reduce((acc, s) => acc + (s.stock ?? 0), 0);
      return {
        productId,
        inStock: total > 0,
        totalStock: total,
        stores,
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
