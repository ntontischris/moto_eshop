import { describe, it, expect, vi, beforeEach } from "vitest";
import { applyTranslation, getProduct } from "./products";

// Per-table canned results the mocked admin client returns from maybeSingle().
const adminResults: Record<string, { data: unknown; error: unknown }> = {};

vi.mock("next/cache", () => ({ cacheTag: () => {}, cacheLife: () => {} }));

vi.mock("@/lib/supabase/admin", () => ({
  // A Proxy-based query builder: every chained method returns the builder,
  // and maybeSingle()/single() resolve to the canned result for the last
  // table passed to from(). Sequential awaits in getProduct keep `table` correct.
  createAdminClient: () => {
    let table = "";
    const builder: unknown = new Proxy(
      {},
      {
        get(_t, prop) {
          if (prop === "from")
            return (t: string) => {
              table = t;
              return builder;
            };
          if (prop === "maybeSingle" || prop === "single")
            return () =>
              Promise.resolve(
                adminResults[table] ?? { data: null, error: null },
              );
          return () => builder;
        },
      },
    );
    return builder;
  },
}));

describe("applyTranslation", () => {
  const base = { name: "Κράνη", description: "Ελληνική περιγραφή", price: 100 };

  it("overlays translated name and description", () => {
    const result = applyTranslation(base, {
      name: "Helmet",
      description: "English description",
    });
    expect(result.name).toBe("Helmet");
    expect(result.description).toBe("English description");
    expect(result.price).toBe(100);
  });

  it("falls back to source when a translated field is null", () => {
    const result = applyTranslation(base, {
      name: "Helmet",
      description: null,
    });
    expect(result.name).toBe("Helmet");
    expect(result.description).toBe("Ελληνική περιγραφή");
  });

  it("falls back to source when a translated field is missing", () => {
    const result = applyTranslation(base, { name: "Helmet" });
    expect(result.name).toBe("Helmet");
    expect(result.description).toBe("Ελληνική περιγραφή");
  });

  it("returns base unchanged when tr is undefined", () => {
    expect(applyTranslation(base, undefined)).toEqual(base);
  });

  it("returns base unchanged when tr is null", () => {
    expect(applyTranslation(base, null)).toEqual(base);
  });

  it("normalizes a missing source description to null", () => {
    const noDesc: { name: string; description?: string | null } = {
      name: "Κράνη",
    };
    const result = applyTranslation(noDesc, { name: "Helmet" });
    expect(result.name).toBe("Helmet");
    expect(result.description).toBeNull();
  });
});

describe("getProduct negative-cache safety", () => {
  beforeEach(() => {
    for (const k of Object.keys(adminResults)) delete adminResults[k];
  });

  it("throws on a transient Supabase error so the failure is never cached as a 404", async () => {
    adminResults.products = { data: null, error: { message: "fetch failed" } };
    await expect(getProduct("any-slug", "en")).rejects.toThrow();
  });

  it("returns null only when the product genuinely does not exist (no error)", async () => {
    adminResults.products = { data: null, error: null };
    await expect(getProduct("missing-slug", "en")).resolves.toBeNull();
  });
});
