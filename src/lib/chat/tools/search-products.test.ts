import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  searchProductsTool,
  searchProductsInputSchema,
  type SearchProductsResult,
  type SearchProductsInput,
} from "./search-products";

vi.mock("@/lib/meilisearch/search-query", () => ({
  searchProducts: vi.fn(),
}));

import { searchProducts as meiliSearch } from "@/lib/meilisearch/search-query";

const mockedSearch = vi.mocked(meiliSearch);

// Helper: call execute with non-null assertion and cast return to our known type
const callExecute = async (input: SearchProductsInput) =>
  (await searchProductsTool.execute!(input, {
    toolCallId: "x",
    messages: [],
  } as never)) as SearchProductsResult;

describe("searchProductsTool", () => {
  beforeEach(() => {
    mockedSearch.mockReset();
  });

  it("has a Zod schema with required query string", () => {
    // Use the exported Zod schema directly — FlexibleSchema wrapper has no safeParse
    expect(searchProductsInputSchema).toBeDefined();
    const result = searchProductsInputSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it("forwards query and filters to Meilisearch", async () => {
    mockedSearch.mockResolvedValueOnce({
      hits: [],
      totalHits: 0,
      hitsPerPage: 24,
      page: 1,
      facets: null,
    });

    await callExecute({
      query: "κράνος",
      filters: { brand: "shoei", priceMax: 500 },
      limit: 8,
    });

    expect(mockedSearch).toHaveBeenCalledWith(
      expect.objectContaining({
        q: "κράνος",
        brand: "shoei",
        priceMax: 500,
      }),
    );
  });

  it("returns slim hit shape — id/slug/name/brand/price/image/in_stock", async () => {
    mockedSearch.mockResolvedValueOnce({
      hits: [
        {
          id: "p1",
          slug: "shoei-rf",
          name: "Shoei RF",
          brand: "Shoei",
          price: 599,
          image_url: "/img.jpg",
          stock: 3,
        } as never,
      ],
      totalHits: 1,
      hitsPerPage: 24,
      page: 1,
      facets: null,
    });

    const out = await callExecute({ query: "shoei" });

    expect(out.hits[0]).toEqual({
      id: "p1",
      slug: "shoei-rf",
      name: "Shoei RF",
      brand: "Shoei",
      price: 599,
      image: "/img.jpg",
      in_stock: true,
    });
    expect(out.totalHits).toBe(1);
  });

  it("caps results at 12 even when caller requests more", async () => {
    mockedSearch.mockResolvedValueOnce({
      hits: Array.from({ length: 24 }, (_, i) => ({
        id: `p${i}`,
        slug: `s${i}`,
        name: `N${i}`,
        brand: "B",
        price: 1,
        image_url: null,
        stock: 1,
      })) as never,
      totalHits: 24,
      hitsPerPage: 24,
      page: 1,
      facets: null,
    });

    const out = await callExecute({ query: "x", limit: 50 });
    expect(out.hits.length).toBe(12);
  });
});
