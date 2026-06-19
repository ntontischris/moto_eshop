import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/supabase/admin", () => ({ createAdminClient: vi.fn() }));
import { createAdminClient } from "@/lib/supabase/admin";
import { getProductSizesBySlug } from "./cart-stock";

type Row = { size: string | null; available: number | null };

/**
 * Stub for `getProductSizesBySlug`: `products` (maybeSingle) resolves slug → id,
 * then `v_product_available_stock` resolves the per-size rows.
 */
function stubBySlug(opts: {
  product: { id: string } | null;
  stock: Row[] | null;
}) {
  return {
    from(table: string) {
      if (table === "products") {
        const chain = {
          select: () => chain,
          eq: () => chain,
          maybeSingle: async () => ({ data: opts.product, error: null }),
        };
        return chain;
      }
      const chain = {
        select: () => chain,
        eq: () => chain,
        then: (resolve: (r: { data: Row[] | null; error: unknown }) => void) =>
          resolve({ data: opts.stock, error: null }),
      };
      return chain;
    },
  };
}

describe("getProductSizesBySlug (in-cart selector options)", () => {
  beforeEach(() => vi.mocked(createAdminClient).mockReset());

  it("returns the product's [Size variant]s for a known slug", async () => {
    vi.mocked(createAdminClient).mockReturnValue(
      stubBySlug({
        product: { id: "p1" },
        stock: [
          { size: "00M", available: 5 },
          { size: "00L", available: 0 },
        ],
      }) as never,
    );
    expect(await getProductSizesBySlug("jacket")).toEqual([
      { code: "00M", display: "M", available: 5, state: "available" },
      { code: "00L", display: "L", available: 0, state: "out" },
    ]);
  });

  it("returns no sizes for an unknown slug", async () => {
    vi.mocked(createAdminClient).mockReturnValue(
      stubBySlug({ product: null, stock: null }) as never,
    );
    expect(await getProductSizesBySlug("ghost")).toEqual([]);
  });
});
