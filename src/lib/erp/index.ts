/**
 * ERP adapter factory.
 * Reads ERP_PROVIDER + provider-specific env, returns the right adapter.
 *
 * Today only Entersoft is supported. When Odoo is wired up, add a branch
 * here — the rest of the app keeps consuming `IErpAdapter`.
 */

import type { IErpAdapter } from "./types";
import { EntersoftAdapter } from "./adapters/entersoft/adapter";

export type ErpProvider = "entersoft" | "odoo";

export function getErpProvider(): ErpProvider {
  const v = (process.env.ERP_PROVIDER ?? "entersoft").toLowerCase();
  if (v === "odoo") return "odoo";
  return "entersoft";
}

let cached: IErpAdapter | null = null;

export function getErp(): IErpAdapter {
  if (cached) return cached;

  const provider = getErpProvider();
  if (provider === "entersoft") {
    const apiKey = process.env.ENTERSOFT_API_KEY;
    if (!apiKey) {
      throw new Error(
        "ENTERSOFT_API_KEY is not set. Add it to .env.local before using the ERP adapter.",
      );
    }
    cached = new EntersoftAdapter({
      apiKey,
      baseUrl: process.env.ENTERSOFT_API_URL,
    });
    return cached;
  }
  throw new Error(`ERP provider "${provider}" is not implemented yet.`);
}

export type { IErpAdapter };
export * from "./types";

// ---------------------------------------------------------------------------
// Chat-facing helpers — thin wrappers over the adapter's bulk methods
// ---------------------------------------------------------------------------

export interface StockStore {
  id: string;
  name: string;
  stock: number;
}

export interface ProductStockResult {
  productId: string;
  stores: StockStore[];
}

const STORE_MAP: Array<{
  key: keyof ReturnType<typeof warehouseStores>;
  id: string;
  name: string;
}> = [
  { key: "sindos", id: "sindos", name: "Σίνδος" },
  { key: "benizelou", id: "benizelou", name: "Βενιζέλου" },
  { key: "antistaseos", id: "antistaseos", name: "Αντιστάσεως" },
  { key: "beinoglou", id: "beinoglou", name: "Μπεϊνόγλου" },
];

// Helper only used for types — not called at runtime
function warehouseStores() {
  return { sindos: 0, benizelou: 0, antistaseos: 0, beinoglou: 0 };
}

/**
 * Returns live per-store stock for a product identified by SKU/erpItemCode.
 * Calls the bulk listStock endpoint and filters client-side — Entersoft PQ
 * does not support per-item filtering.
 *
 * @param productId  SKU or erpItemCode (e.g. "ABC-123")
 * @param variantId  Optional stock dimension (size/color)
 */
export async function getStockForProduct({
  productId,
  variantId,
}: {
  productId: string;
  variantId?: string;
}): Promise<ProductStockResult> {
  const erp = getErp();
  // Fetch enough rows to cover the product; most products have few variants.
  // 500 is the adapter default page size — sufficient for a single SKU lookup.
  const page = await erp.listStock({ page: 1, pageSize: 500 });

  const matchingLines = page.rows.filter((line) => {
    const skuMatch = line.erpItemCode === productId;
    if (!skuMatch) return false;
    if (variantId) return line.dimension === variantId;
    return true;
  });

  // Aggregate stock across matched lines (e.g. multiple dimensions) per warehouse
  const totals: Record<string, number> = {
    sindos: 0,
    benizelou: 0,
    antistaseos: 0,
    beinoglou: 0,
  };

  for (const line of matchingLines) {
    for (const wh of Object.keys(totals) as Array<keyof typeof totals>) {
      totals[wh] +=
        line.byWarehouse[wh as import("./types").WarehouseCode] ?? 0;
    }
  }

  const stores: StockStore[] = STORE_MAP.map(({ key, id, name }) => ({
    id,
    name,
    stock: totals[key] ?? 0,
  }));

  return { productId, stores };
}
