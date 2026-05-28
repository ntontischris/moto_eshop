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

// Supabase fallback path now also runs when Meili returns empty — stub the
// client so existing empty-Meili tests don't hit a real network call.
const supabaseFallbackData: { value: unknown[] } = { value: [] };
const supabaseMock = {
  from: vi.fn(() => {
    const chain: Record<string, unknown> = {};
    const thenable = {
      then: (resolve: (v: { data: unknown[]; error: null }) => void) =>
        resolve({ data: supabaseFallbackData.value, error: null }),
    };
    Object.assign(chain, {
      select: () => chain,
      eq: () => chain,
      or: () => chain,
      gte: () => chain,
      lte: () => chain,
      limit: () => thenable,
    });
    return chain;
  }),
};
vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => supabaseMock),
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
    supabaseFallbackData.value = []; // default: fallback also empty
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

  it("falls back to Supabase ILIKE when Meilisearch returns empty", async () => {
    mockedSearch.mockResolvedValueOnce({
      hits: [],
      totalHits: 0,
      hitsPerPage: 24,
      page: 1,
      facets: null,
    });
    supabaseFallbackData.value = [
      {
        id: "p9",
        slug: "klim-jacket",
        name: "Klim Latitude",
        price: 850,
        images: ["/k.jpg"],
        images_cdn: null,
        stock: 1,
        brands: { name: "Klim" },
      },
    ];

    const out = await callExecute({ query: "klim" });
    expect(out.hits).toHaveLength(1);
    expect(out.hits[0]).toEqual({
      id: "p9",
      slug: "klim-jacket",
      name: "Klim Latitude",
      brand: "Klim",
      price: 850,
      image: "/k.jpg",
      in_stock: true,
    });
  });

  it("falls back to Supabase when Meilisearch throws", async () => {
    mockedSearch.mockRejectedValueOnce(new Error("meili down"));
    supabaseFallbackData.value = [
      {
        id: "p1",
        slug: "x",
        name: "X",
        price: 1,
        images: [],
        images_cdn: null,
        stock: 0,
        brands: null,
      },
    ];
    const out = await callExecute({ query: "anything" });
    expect(out.hits).toHaveLength(1);
    expect(out.hits[0].in_stock).toBe(false);
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
