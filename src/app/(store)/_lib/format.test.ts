import { describe, it, expect } from "vitest";
import { formatPrice, discountPercent, hasDiscount } from "./format";

describe("format", () => {
  it("formats EUR with greek locale", () => {
    // Node ICU (el-GR + EUR) emits U+00A0 NO-BREAK SPACE between digits and €, not plain ASCII space.
    expect(formatPrice(199)).toBe("199,00 €");
    expect(formatPrice(199.9)).toBe("199,90 €");
  });
  it("computes discount percent rounded", () => {
    expect(discountPercent(80, 100)).toBe(20);
    expect(discountPercent(67, 100)).toBe(33);
  });
  it("hasDiscount only when compare > price", () => {
    expect(hasDiscount(80, 100)).toBe(true);
    expect(hasDiscount(100, 100)).toBe(false);
    expect(hasDiscount(80, null)).toBe(false);
  });
});
