import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  compareProductsTool,
  compareProductsInputSchema,
  type CompareProductsResult,
} from "./compare-products";

const supabaseMock = { from: vi.fn() };

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => supabaseMock),
}));

describe("compareProductsTool", () => {
  beforeEach(() => supabaseMock.from.mockReset());

  it("requires between 2 and 4 product ids", () => {
    expect(
      compareProductsInputSchema.safeParse({ productIds: ["a"] }).success,
    ).toBe(false);
    expect(
      compareProductsInputSchema.safeParse({
        productIds: ["a", "b", "c", "d", "e"],
      }).success,
    ).toBe(false);
    expect(
      compareProductsInputSchema.safeParse({ productIds: ["a", "b"] }).success,
    ).toBe(true);
  });

  it("returns products with comparison fields", async () => {
    supabaseMock.from.mockImplementation(() => ({
      select: () => ({
        in: () => ({
          limit: async () => ({
            data: [
              {
                id: "p1",
                slug: "shoei-rf",
                name: "Shoei RF",
                price: 599,
                images: ["/a.jpg"],
                images_cdn: null,
                stock: 2,
                weight_grams: 1450,
                certifications: ["ECE 22.06"],
                brands: { name: "Shoei" },
              },
              {
                id: "p2",
                slug: "agv-k6",
                name: "AGV K6",
                price: 499,
                images: ["/b.jpg"],
                images_cdn: null,
                stock: 0,
                weight_grams: 1380,
                certifications: ["ECE 22.06", "DOT"],
                brands: { name: "AGV" },
              },
            ],
            error: null,
          }),
        }),
      }),
    }));

    const out = (await compareProductsTool.execute!(
      { productIds: ["p1", "p2"] },
      { toolCallId: "x", messages: [] } as never,
    )) as CompareProductsResult;

    expect(out.products).toHaveLength(2);
    expect(out.fields).toContain("price");
    expect(out.fields).toContain("weight");
    expect(out.products[0].weight).toBe(1450);
    expect(out.products[1].in_stock).toBe(false);
  });
});
