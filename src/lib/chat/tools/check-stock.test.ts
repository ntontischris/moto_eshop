import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  checkStockTool,
  checkStockInputSchema,
  type CheckStockResult,
} from "./check-stock";

vi.mock("@/lib/erp", async () => {
  const actual = await vi.importActual<typeof import("@/lib/erp")>("@/lib/erp");
  return { ...actual, getStockForProduct: vi.fn() };
});
vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));

import { getStockForProduct } from "@/lib/erp";
import { createClient } from "@/lib/supabase/server";

const mockedStock = vi.mocked(getStockForProduct);
const mockedClient = vi.mocked(createClient);

type ProductRow = { id: string; sku: string | null } | null;
type LocationRow = { warehouse_code: string; available: number };

/**
 * Stub Supabase for both reads the tool performs:
 *  - products: select().eq().maybeSingle() -> the product row (or null)
 *  - product_stock_locations: awaited select().eq()[.eq()] -> location rows
 */
function stubSupabase(product: ProductRow, locations: LocationRow[] = []) {
  mockedClient.mockResolvedValue({
    from: (table: string) => {
      if (table === "products") {
        return {
          select: () => ({
            eq: () => ({
              maybeSingle: async () => ({ data: product, error: null }),
            }),
          }),
        };
      }
      // product_stock_locations — a thenable query builder so `await query`
      // resolves to the rows and `.eq()` stays chainable (variant filter).
      const result = { data: locations, error: null };
      const builder: Record<string, unknown> = {
        select: () => builder,
        eq: () => builder,
        then: (resolve: (v: typeof result) => unknown) => resolve(result),
      };
      return builder;
    },
  } as never);
}

const ctx = { toolCallId: "x", messages: [] } as never;

describe("checkStockTool", () => {
  beforeEach(() => {
    mockedStock.mockReset();
    mockedClient.mockReset();
    delete process.env.ERP_LIVE_STOCK;
  });
  afterEach(() => {
    delete process.env.ERP_LIVE_STOCK;
  });

  it("requires productId in schema", () => {
    expect(checkStockInputSchema.safeParse({}).success).toBe(false);
  });

  it("reads the synced snapshot (no live ERP) by default", async () => {
    stubSupabase({ id: "uuid-1", sku: "ABC-123" }, [
      { warehouse_code: "sindos", available: 3 },
      { warehouse_code: "benizelou", available: 1 },
    ]);
    const out = (await checkStockTool.execute!(
      { productId: "shoei-nxr2" },
      ctx,
    )) as CheckStockResult;
    expect(mockedStock).not.toHaveBeenCalled();
    expect(out.totalStock).toBe(4);
    expect(out.inStock).toBe(true);
    expect(out.stores).toHaveLength(4);
  });

  it("calls the live ERP only when ERP_LIVE_STOCK=true", async () => {
    process.env.ERP_LIVE_STOCK = "true";
    stubSupabase({ id: "uuid-1", sku: "ABC-123" });
    mockedStock.mockResolvedValueOnce({
      productId: "ABC-123",
      stores: [
        { id: "sindos", name: "Σίνδος", stock: 3 },
        { id: "benizelou", name: "Βενιζέλου", stock: 1 },
      ],
    });
    const out = (await checkStockTool.execute!(
      { productId: "shoei-nxr2" },
      ctx,
    )) as CheckStockResult;
    expect(mockedStock).toHaveBeenCalledWith({
      productId: "ABC-123",
      variantId: undefined,
    });
    expect(out.totalStock).toBe(4);
    expect(out.inStock).toBe(true);
  });

  it("reports unavailable (not fake 0) when the product has no SKU", async () => {
    stubSupabase(null);
    const out = (await checkStockTool.execute!(
      { productId: "shoei-nxr2" },
      ctx,
    )) as CheckStockResult;
    expect(mockedStock).not.toHaveBeenCalled();
    expect(out.inStock).toBe(false);
    expect(out.error).toContain("unavailable");
  });

  it("falls through gracefully on ERP error", async () => {
    process.env.ERP_LIVE_STOCK = "true";
    stubSupabase({ id: "uuid-1", sku: "ABC-123" });
    mockedStock.mockRejectedValueOnce(new Error("ERP down"));
    const out = (await checkStockTool.execute!(
      { productId: "shoei-nxr2" },
      ctx,
    )) as CheckStockResult;
    expect(out.inStock).toBe(false);
    expect(out.error).toContain("unavailable");
  });
});
