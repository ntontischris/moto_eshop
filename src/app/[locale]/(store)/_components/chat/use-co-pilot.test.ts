import { describe, it, expect } from "vitest";
import { resolveNavigateTo, resolveApplyFilters } from "./use-co-pilot";

describe("resolveNavigateTo", () => {
  it("returns ok with locale-prefixed route", () => {
    const r = resolveNavigateTo({
      route: "/category/kranh",
      locale: "el",
      currentPath: "/el",
    });
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.target).toBe("/el/category/kranh");
  });
  it("preserves an already-prefixed locale", () => {
    const r = resolveNavigateTo({
      route: "/en/product/foo",
      locale: "en",
      currentPath: "/en",
    });
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.target).toBe("/en/product/foo");
  });
  it("refuses admin", () => {
    const r = resolveNavigateTo({
      route: "/admin",
      locale: "el",
      currentPath: "/el",
    });
    expect(r.ok).toBe(false);
  });
  it("refuses checkout sub-route", () => {
    const r = resolveNavigateTo({
      route: "/checkout/payment",
      locale: "el",
      currentPath: "/el/checkout",
    });
    expect(r.ok).toBe(false);
  });
});

describe("resolveApplyFilters", () => {
  it("returns ok with target URL on a PLP", () => {
    const r = resolveApplyFilters({
      filters: { color: "black", priceMax: 300 },
      currentPath: "/el/category/kranh",
    });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.target.startsWith("/el/category/kranh?")).toBe(true);
      expect(r.target).toContain("color=black");
      expect(r.target).toContain("price_max=300");
      expect(r.appliedKeys).toContain("color");
      expect(r.appliedKeys).toContain("priceMax");
    }
  });
  it("rejects when not on a PLP route", () => {
    const r = resolveApplyFilters({
      filters: { color: "black" },
      currentPath: "/el",
    });
    expect(r.ok).toBe(false);
  });
});
