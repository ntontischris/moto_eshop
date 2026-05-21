import { describe, expect, it } from "vitest";
import { getCartRecommendations } from "./cart-recommendations";

describe("cart recommendations", () => {
  it("recommends helmet accessories when the cart contains a helmet", () => {
    const recs = getCartRecommendations([
      {
        name: "AGV K1 S helmet",
        brand: "AGV",
        slug: "agv-k1-s",
        categorySlug: "eksoplismos-anabath",
      },
    ]);

    expect(recs.map((r) => r.title)).toContain("Pinlock / ζελατίνες");
    expect(recs[0].href).toContain("pinlock");
  });

  it("recommends protection and gloves for apparel", () => {
    const recs = getCartRecommendations([
      {
        name: "Rev'It Eclipse 2 Pants Lady black",
        brand: "REV'IT",
        slug: "rev000pan53",
        categorySlug: "endysh--mpoyfan",
      },
    ]);

    expect(recs.map((r) => r.title)).toContain("Γάντια που ταιριάζουν");
    expect(recs.map((r) => r.title)).toContain("Προστασία πλάτης");
  });

  it("deduplicates recommendations and limits the list", () => {
    const recs = getCartRecommendations([
      { name: "Helmet", brand: "AGV", slug: "helmet" },
      { name: "Full face κράνος", brand: "Shoei", slug: "shoei" },
      { name: "Touring jacket", brand: "Dainese", slug: "jacket" },
    ]);

    expect(new Set(recs.map((r) => r.title)).size).toBe(recs.length);
    expect(recs.length).toBeLessThanOrEqual(4);
  });
});
