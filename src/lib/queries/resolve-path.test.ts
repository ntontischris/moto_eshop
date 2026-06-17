import { beforeEach, describe, expect, it, vi } from "vitest";

// #112 (P1): the catch-all route's path resolution must be a cached helper
// backed by the cookie-free admin client, so PDP/PLP stop paying for an
// uncached DB round-trip (twice per request) and the route is not forced
// dynamic. next/cache + supabase admin + category lookup are mocked so we can
// exercise the resolution contract in isolation.
vi.mock("next/cache", () => ({ cacheTag: vi.fn(), cacheLife: vi.fn() }));

const maybeSingle = vi.fn();
const eqStatus = vi.fn(() => ({ maybeSingle }));
const eqSlug = vi.fn(() => ({ eq: eqStatus }));
const select = vi.fn(() => ({ eq: eqSlug }));
const from = vi.fn(() => ({ select }));
const createAdminClient = vi.fn(() => ({ from }));
vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => createAdminClient(),
}));

const getCategoryByPath = vi.fn();
vi.mock("@/lib/queries/categories", () => ({
  getCategoryByPath: (...args: unknown[]) => getCategoryByPath(...args),
}));

import { resolvePath } from "./resolve-path";

describe("resolvePath", () => {
  beforeEach(() => {
    maybeSingle.mockReset();
    getCategoryByPath.mockReset();
    createAdminClient.mockClear();
  });

  it("returns not_found for empty segments without touching the database", async () => {
    const result = await resolvePath([]);
    expect(result).toEqual({ kind: "not_found" });
    expect(createAdminClient).not.toHaveBeenCalled();
  });

  it("resolves a product when the last segment matches an active product slug", async () => {
    maybeSingle.mockResolvedValue({
      data: {
        id: "p1",
        slug: "abudisloc30",
        category_id: "c1",
        categories: { full_path: "eksoplismos/endysh" },
      },
      error: null,
    });

    const result = await resolvePath(["eksoplismos", "endysh", "abudisloc30"]);

    expect(result).toEqual({
      kind: "product",
      productId: "p1",
      productSlug: "abudisloc30",
      canonicalPath: ["eksoplismos", "endysh", "abudisloc30"],
    });
    expect(getCategoryByPath).not.toHaveBeenCalled();
  });

  it("falls back to a category when no product matches", async () => {
    maybeSingle.mockResolvedValue({ data: null, error: null });
    getCategoryByPath.mockResolvedValue({
      id: "c1",
      slug: "endysh",
      full_path: "eksoplismos/endysh",
    });

    const result = await resolvePath(["eksoplismos", "endysh"]);

    expect(result).toEqual({
      kind: "category",
      categoryId: "c1",
      categorySlug: "endysh",
      fullPath: "eksoplismos/endysh",
    });
  });

  it("returns not_found when neither product nor category matches", async () => {
    maybeSingle.mockResolvedValue({ data: null, error: null });
    getCategoryByPath.mockResolvedValue(null);

    const result = await resolvePath(["nope", "missing"]);
    expect(result).toEqual({ kind: "not_found" });
  });

  it("throws on a transient DB error so the failure is not cached as not_found", async () => {
    maybeSingle.mockResolvedValue({ data: null, error: { message: "boom" } });
    await expect(resolvePath(["a", "b", "c"])).rejects.toThrow(/boom/);
  });
});
