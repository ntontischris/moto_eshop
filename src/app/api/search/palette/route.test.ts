import { beforeEach, describe, expect, it, vi } from "vitest";

// #118 review fix: now that searchProducts / searchCategories THROW on a
// transient Supabase error (so the failure isn't negative-cached), the ⌘K
// palette route must degrade to empty results instead of 500-ing on a hot,
// interactive path.
const searchProducts = vi.fn();
const searchCategories = vi.fn();
vi.mock("@/lib/queries/products", () => ({
  searchProducts: (...args: unknown[]) => searchProducts(...args),
}));
vi.mock("@/lib/queries/categories", () => ({
  searchCategories: (...args: unknown[]) => searchCategories(...args),
}));

import { GET } from "./route";

function req(q: string): Request {
  return new Request(
    `http://localhost/api/search/palette?q=${encodeURIComponent(q)}`,
  );
}

describe("palette search route", () => {
  beforeEach(() => {
    searchProducts.mockReset();
    searchCategories.mockReset();
  });

  it("returns empty results for a short query without a DB call", async () => {
    const res = await GET(req("a"));
    expect(await res.json()).toEqual({ products: [], categories: [] });
    expect(searchProducts).not.toHaveBeenCalled();
  });

  it("degrades to empty results when a query throws instead of 500-ing", async () => {
    searchProducts.mockRejectedValue(new Error("boom"));
    searchCategories.mockResolvedValue([]);

    const res = await GET(req("helmet"));

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ products: [], categories: [] });
  });
});
