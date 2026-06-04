import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  checkStockTool,
  checkStockInputSchema,
  type CheckStockResult,
} from "./check-stock";

vi.mock("@/lib/erp", () => ({ getStockForProduct: vi.fn() }));
vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));

import { getStockForProduct } from "@/lib/erp";
import { createClient } from "@/lib/supabase/server";

const mockedStock = vi.mocked(getStockForProduct);
const mockedClient = vi.mocked(createClient);

/** Stub Supabase so products.sku resolution returns `sku` (or null). */
function stubSku(sku: string | null) {
  mockedClient.mockResolvedValue({
    from: () => ({
      select: () => ({
        eq: () => ({
          maybeSingle: async () => ({
            data: sku === null ? null : { sku },
            error: null,
          }),
        }),
      }),
    }),
  } as never);
}

const ctx = { toolCallId: "x", messages: [] } as never;

describe("checkStockTool", () => {
  beforeEach(() => {
    mockedStock.mockReset();
    mockedClient.mockReset();
  });

  it("requires productId in schema", () => {
    expect(checkStockInputSchema.safeParse({}).success).toBe(false);
  });

  it("resolves the catalog id to a SKU before calling the ERP", async () => {
    stubSku("ABC-123");
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
    stubSku(null);
    const out = (await checkStockTool.execute!(
      { productId: "shoei-nxr2" },
      ctx,
    )) as CheckStockResult;
    expect(mockedStock).not.toHaveBeenCalled();
    expect(out.inStock).toBe(false);
    expect(out.error).toContain("unavailable");
  });

  it("falls through gracefully on ERP error", async () => {
    stubSku("ABC-123");
    mockedStock.mockRejectedValueOnce(new Error("ERP down"));
    const out = (await checkStockTool.execute!(
      { productId: "shoei-nxr2" },
      ctx,
    )) as CheckStockResult;
    expect(out.inStock).toBe(false);
    expect(out.error).toContain("unavailable");
  });
});
