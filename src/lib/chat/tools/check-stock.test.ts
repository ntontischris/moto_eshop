import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  checkStockTool,
  checkStockInputSchema,
  type CheckStockResult,
} from "./check-stock";

vi.mock("@/lib/erp", () => ({
  getStockForProduct: vi.fn(),
}));

import { getStockForProduct } from "@/lib/erp";
const mocked = vi.mocked(getStockForProduct);

describe("checkStockTool", () => {
  beforeEach(() => mocked.mockReset());

  it("requires productId in schema", () => {
    const r = checkStockInputSchema.safeParse({});
    expect(r.success).toBe(false);
  });

  it("returns per-store stock plus a total", async () => {
    mocked.mockResolvedValueOnce({
      productId: "p1",
      stores: [
        { id: "kallithea", name: "Καλλιθέα", stock: 3 },
        { id: "thessaloniki", name: "Θεσσαλονίκη", stock: 1 },
        { id: "warehouse", name: "Αποθήκη", stock: 8 },
      ],
    });
    const out = (await checkStockTool.execute!({ productId: "p1" }, {
      toolCallId: "x",
      messages: [],
    } as never)) as CheckStockResult;
    expect(out.totalStock).toBe(12);
    expect(out.stores).toHaveLength(3);
    expect(out.inStock).toBe(true);
  });

  it("returns inStock=false and empty stores when nothing returned", async () => {
    mocked.mockResolvedValueOnce({ productId: "p1", stores: [] });
    const out = (await checkStockTool.execute!({ productId: "p1" }, {
      toolCallId: "x",
      messages: [],
    } as never)) as CheckStockResult;
    expect(out.totalStock).toBe(0);
    expect(out.inStock).toBe(false);
  });

  it("falls through gracefully on ERP error (returns unknown stock, not throws)", async () => {
    mocked.mockRejectedValueOnce(new Error("ERP down"));
    const out = (await checkStockTool.execute!({ productId: "p1" }, {
      toolCallId: "x",
      messages: [],
    } as never)) as CheckStockResult;
    expect(out.inStock).toBe(false);
    expect(out.error).toContain("unavailable");
  });
});
