import { describe, it, expect } from "vitest";
import { parsePlpParams, buildPlpQuery } from "./plp-params";

describe("plp-params", () => {
  it("parses defaults", () => {
    expect(parsePlpParams({})).toEqual({
      sort: "popular",
      brands: [],
      priceMin: undefined,
      priceMax: undefined,
      page: 1,
    });
  });
  it("parses provided values", () => {
    expect(
      parsePlpParams({
        sort: "price_asc",
        brands: "agv,shoei",
        price_min: "50",
        price_max: "300",
        page: "2",
      }),
    ).toEqual({
      sort: "price_asc",
      brands: ["agv", "shoei"],
      priceMin: 50,
      priceMax: 300,
      page: 2,
    });
  });
  it("serializes back, omitting defaults", () => {
    expect(
      buildPlpQuery({
        sort: "popular",
        brands: [],
        priceMin: undefined,
        priceMax: undefined,
        page: 1,
      }),
    ).toBe("");
    expect(
      buildPlpQuery({
        sort: "newest",
        brands: ["agv"],
        priceMin: 50,
        priceMax: undefined,
        page: 3,
      }),
    ).toBe("?sort=newest&brands=agv&price_min=50&page=3");
  });
});
