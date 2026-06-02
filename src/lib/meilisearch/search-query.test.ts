import { describe, it, expect, vi, beforeEach } from "vitest";

// The Supabase catalog search is the fallback target. Mock it so the test
// asserts wiring, not a real DB call.
vi.mock("@/lib/queries/products", () => ({
  searchProducts: vi.fn(),
}));

import { searchProducts as supabaseSearch } from "@/lib/queries/products";
import { searchProducts } from "./search-query";

const mockedSupabase = vi.mocked(supabaseSearch);

const productListItem = {
  id: "p1",
  slug: "shoei-rf",
  name: "Shoei RF",
  brand: "Shoei",
  brand_slug: "shoei",
  price: 599,
  compare_at_price: null,
  category_slug: "helmets",
  stock: 3,
  certification: "ECE",
  rider_type: "touring",
  primary_image_url: "/img.jpg",
  primary_image_alt: "Shoei RF",
  secondary_image_url: null,
  gallery_image_urls: [],
  average_rating: 4.5,
  review_count: 10,
};

describe("meilisearch searchProducts fallback", () => {
  beforeEach(() => {
    mockedSupabase.mockReset();
    // No host configured → getClient() returns null (the production reality;
    // MEILI_HOST is commented out). Must not silently return empty.
    delete process.env.NEXT_PUBLIC_MEILI_HOST;
  });

  it("falls back to Supabase when Meili host is not configured", async () => {
    mockedSupabase.mockResolvedValueOnce({
      data: [productListItem],
      total: 1,
      page: 1,
      perPage: 24,
      totalPages: 1,
    } as never);

    const result = await searchProducts({ q: "shoei" });

    expect(mockedSupabase).toHaveBeenCalled();
    expect(result.hits).toHaveLength(1);
    expect(result.hits[0]).toMatchObject({
      id: "p1",
      slug: "shoei-rf",
      name: "Shoei RF",
      brand: "Shoei",
      price: 599,
      in_stock: true,
      stock: 3,
      primary_image_url: "/img.jpg",
    });
    expect(result.totalHits).toBe(1);
  });
});
