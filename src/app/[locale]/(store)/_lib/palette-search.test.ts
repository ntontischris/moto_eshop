import { describe, it, expect } from "vitest";
import {
  toPaletteProduct,
  toPaletteCategory,
  toPaletteResults,
  paletteResultCount,
  type RawPaletteProduct,
  type RawPaletteCategory,
} from "./palette-search";

const rawProduct: RawPaletteProduct = {
  id: "p1",
  slug: "agv-k6",
  name: "AGV K6",
  brand: "AGV",
  price: 499.9,
  category_path: "eksoplismos-anabath/krani",
  primary_image_url: "/img/agv-k6.webp",
};

const rawCategory: RawPaletteCategory = {
  id: "c1",
  name: "Κράνη",
  full_path: "eksoplismos-anabath/krani",
  slug: "krani",
};

describe("toPaletteProduct", () => {
  it("maps a catalog row to a deep-linkable Clean URL product", () => {
    expect(toPaletteProduct(rawProduct)).toEqual({
      id: "p1",
      name: "AGV K6",
      brand: "AGV",
      price: 499.9,
      image: "/img/agv-k6.webp",
      href: "/eksoplismos-anabath/krani/agv-k6",
    });
  });

  it("falls back to /{slug} when category path is missing", () => {
    expect(toPaletteProduct({ ...rawProduct, category_path: null }).href).toBe(
      "/agv-k6",
    );
  });
});

describe("toPaletteCategory", () => {
  it("links a category to its full_path Clean URL", () => {
    expect(toPaletteCategory(rawCategory).href).toBe(
      "/eksoplismos-anabath/krani",
    );
  });

  it("falls back to the slug when full_path is absent (root category)", () => {
    expect(toPaletteCategory({ ...rawCategory, full_path: null }).href).toBe(
      "/krani",
    );
  });
});

describe("toPaletteResults", () => {
  it("groups products and categories into a single result set", () => {
    const results = toPaletteResults([rawProduct], [rawCategory]);
    expect(results.products).toHaveLength(1);
    expect(results.categories).toHaveLength(1);
    expect(results.products[0].href).toBe("/eksoplismos-anabath/krani/agv-k6");
    expect(results.categories[0].href).toBe("/eksoplismos-anabath/krani");
  });

  it("returns empty groups for empty input", () => {
    expect(toPaletteResults([], [])).toEqual({
      products: [],
      categories: [],
    });
  });
});

describe("paletteResultCount", () => {
  it("sums products and categories for the SR announcement", () => {
    expect(
      paletteResultCount(toPaletteResults([rawProduct], [rawCategory])),
    ).toBe(2);
  });

  it("is zero when nothing matched", () => {
    expect(paletteResultCount({ products: [], categories: [] })).toBe(0);
  });
});
