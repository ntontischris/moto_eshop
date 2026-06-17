import { beforeEach, describe, expect, it, vi } from "vitest";

// #118 review fix: searchProducts / searchCategories run under "use cache".
// A transient Supabase error that returns an empty fallback gets cached for
// minutes — the same negative-cache class as the prerender-404 outage. They
// must THROW on a real error so the failure is never persisted, while a
// genuinely empty result still returns empty. next/cache + admin client mocked
// to exercise the contract in isolation (mirrors resolve-path.test.ts).
vi.mock("next/cache", () => ({ cacheTag: vi.fn(), cacheLife: vi.fn() }));

const productsRange = vi.fn();
const categoriesLimit = vi.fn();

function makeClient() {
  return {
    from: (table: string) => {
      if (table === "brands") {
        return {
          select: () => ({ ilike: () => Promise.resolve({ data: [] }) }),
        };
      }
      if (table === "products") {
        return {
          select: () => ({
            eq: () => ({
              or: () => ({
                order: () => ({ range: () => productsRange() }),
              }),
            }),
          }),
        };
      }
      if (table === "categories") {
        return {
          select: () => ({
            ilike: () => ({
              order: () => ({ limit: () => categoriesLimit() }),
            }),
          }),
        };
      }
      throw new Error(`unexpected table ${table}`);
    },
  };
}

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => makeClient(),
}));

import { searchProducts } from "./products";
import { searchCategories } from "./categories";

describe("search helpers do not cache transient failures", () => {
  beforeEach(() => {
    productsRange.mockReset();
    categoriesLimit.mockReset();
  });

  it("searchProducts throws on a Supabase error instead of caching empty", async () => {
    productsRange.mockResolvedValue({
      data: null,
      error: { message: "boom" },
      count: null,
    });
    await expect(searchProducts("helmet")).rejects.toThrow(/boom/);
  });

  it("searchProducts returns empty for a short query without a DB call", async () => {
    await expect(searchProducts("a")).resolves.toEqual({
      data: [],
      total: 0,
      page: 1,
      perPage: 24,
      totalPages: 0,
    });
  });

  it("searchCategories throws on a Supabase error", async () => {
    categoriesLimit.mockResolvedValue({
      data: null,
      error: { message: "kaboom" },
    });
    await expect(searchCategories("helmet")).rejects.toThrow(/kaboom/);
  });

  it("searchCategories returns [] for a genuinely empty result", async () => {
    categoriesLimit.mockResolvedValue({ data: [], error: null });
    await expect(searchCategories("zzzz")).resolves.toEqual([]);
  });
});
