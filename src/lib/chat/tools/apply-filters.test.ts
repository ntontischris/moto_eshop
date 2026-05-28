import { describe, it, expect } from "vitest";
import {
  applyFiltersInputSchema,
  buildFilterSearchParams,
  isFilterContextAllowed,
} from "./apply-filters";

describe("applyFiltersInputSchema", () => {
  it("accepts a minimal filters object", () => {
    expect(
      applyFiltersInputSchema.safeParse({ filters: { color: "black" } })
        .success,
    ).toBe(true);
  });
  it("accepts mixed filters", () => {
    expect(
      applyFiltersInputSchema.safeParse({
        filters: { color: "black", brand: "shoei", priceMax: 300 },
      }).success,
    ).toBe(true);
  });
  it("rejects empty filters object", () => {
    expect(applyFiltersInputSchema.safeParse({ filters: {} }).success).toBe(
      false,
    );
  });
});

describe("buildFilterSearchParams", () => {
  it("encodes string filters as query keys", () => {
    const p = buildFilterSearchParams({ color: "black", brand: "shoei" });
    expect(p.get("color")).toBe("black");
    expect(p.get("brand")).toBe("shoei");
  });
  it("encodes numeric ranges as price_min / price_max", () => {
    const p = buildFilterSearchParams({ priceMin: 100, priceMax: 300 });
    expect(p.get("price_min")).toBe("100");
    expect(p.get("price_max")).toBe("300");
  });
  it("skips undefined values", () => {
    const p = buildFilterSearchParams({ color: undefined, brand: "shoei" });
    expect(p.has("color")).toBe(false);
    expect(p.get("brand")).toBe("shoei");
  });
});

describe("isFilterContextAllowed", () => {
  it("allows filters on a PLP route", () => {
    expect(isFilterContextAllowed("/el/category/kranh")).toBe(true);
    expect(isFilterContextAllowed("/category/kranh--touring")).toBe(true);
  });
  it("rejects filters on PDP / home / cart / checkout", () => {
    expect(isFilterContextAllowed("/")).toBe(false);
    expect(isFilterContextAllowed("/product/foo")).toBe(false);
    expect(isFilterContextAllowed("/cart")).toBe(false);
    expect(isFilterContextAllowed("/checkout")).toBe(false);
  });
});
