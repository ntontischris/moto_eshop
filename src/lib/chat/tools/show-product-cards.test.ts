import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  showProductCardsTool,
  showProductCardsInputSchema,
  type ShowProductCardsResult,
} from "./show-product-cards";

const supabaseMock = { from: vi.fn() };

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => supabaseMock),
}));

function mockProductsResponse(rows: unknown[]) {
  supabaseMock.from.mockImplementation(() => ({
    select: () => ({
      in: () => ({
        limit: async () => ({ data: rows, error: null }),
      }),
    }),
  }));
}

describe("showProductCardsTool", () => {
  beforeEach(() => supabaseMock.from.mockReset());

  it("rejects empty productIds array", () => {
    const r = showProductCardsInputSchema.safeParse({ productIds: [] });
    expect(r.success).toBe(false);
  });

  it("rejects more than 6 productIds", () => {
    const r = showProductCardsInputSchema.safeParse({
      productIds: ["a", "b", "c", "d", "e", "f", "g"],
    });
    expect(r.success).toBe(false);
  });

  it("returns enriched products and tracks notFound", async () => {
    mockProductsResponse([
      {
        id: "p1",
        slug: "shoei-rf",
        name: "Shoei RF",
        price: 599,
        images: ["/img1.jpg"],
        images_cdn: null,
        stock: 3,
        brands: { name: "Shoei" },
      },
    ]);

    const out = (await showProductCardsTool.execute!(
      { productIds: ["p1", "missing-id"] },
      { toolCallId: "x", messages: [] } as never,
    )) as ShowProductCardsResult;

    expect(out.products).toHaveLength(1);
    expect(out.products[0].name).toBe("Shoei RF");
    expect(out.products[0].brand).toBe("Shoei");
    expect(out.products[0].in_stock).toBe(true);
    expect(out.notFound).toEqual(["missing-id"]);
  });
});
