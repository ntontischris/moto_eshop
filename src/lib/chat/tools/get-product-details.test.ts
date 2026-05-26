import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  getProductDetailsTool,
  getProductDetailsInputSchema,
  type GetProductDetailsResult,
} from "./get-product-details";

const supabaseMock = { from: vi.fn() };

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => supabaseMock),
}));

describe("getProductDetailsTool", () => {
  beforeEach(() => {
    supabaseMock.from.mockReset();
  });

  it("requires productId in schema", () => {
    const r = getProductDetailsInputSchema.safeParse({});
    expect(r.success).toBe(false);
  });

  it("returns notFound when product missing", async () => {
    supabaseMock.from.mockImplementation(() => ({
      select: () => ({
        eq: () => ({ maybeSingle: async () => ({ data: null }) }),
      }),
    }));

    const out = (await getProductDetailsTool.execute!(
      { productId: "missing" },
      { toolCallId: "x", messages: [] } as never,
    )) as GetProductDetailsResult;
    expect(out.found).toBe(false);
  });

  it("returns product on success with key fields", async () => {
    supabaseMock.from.mockImplementation(() => ({
      select: () => ({
        eq: () => ({
          maybeSingle: async () => ({
            data: {
              id: "p1",
              slug: "shoei-rf",
              name: "Shoei RF",
              brands: { name: "Shoei" },
              price: 599,
              description: "Top of the line.",
              images: ["/img.jpg"],
              images_cdn: null,
              stock: 5,
            },
          }),
        }),
      }),
    }));

    const out = (await getProductDetailsTool.execute!({ productId: "p1" }, {
      toolCallId: "x",
      messages: [],
    } as never)) as GetProductDetailsResult;
    expect(out.found).toBe(true);
    if (out.found) {
      expect(out.product.name).toBe("Shoei RF");
      expect(out.product.price).toBe(599);
      expect(out.product.brand).toBe("Shoei");
      expect(out.product.in_stock).toBe(true);
    }
  });

  it("marks out-of-stock correctly when stock is 0", async () => {
    supabaseMock.from.mockImplementation(() => ({
      select: () => ({
        eq: () => ({
          maybeSingle: async () => ({
            data: {
              id: "p2",
              slug: "agv-k6",
              name: "AGV K6",
              brands: { name: "AGV" },
              price: 399,
              description: null,
              images: [],
              images_cdn: null,
              stock: 0,
            },
          }),
        }),
      }),
    }));

    const out = (await getProductDetailsTool.execute!({ productId: "agv-k6" }, {
      toolCallId: "x",
      messages: [],
    } as never)) as GetProductDetailsResult;
    expect(out.found).toBe(true);
    if (out.found) {
      expect(out.product.in_stock).toBe(false);
      expect(out.product.image).toBeNull();
    }
  });
});
