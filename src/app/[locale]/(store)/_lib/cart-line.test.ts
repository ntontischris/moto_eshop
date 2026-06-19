import { describe, expect, it } from "vitest";
import { cartLineKey, changeCartLineSize, type CartLine } from "./cart-line";

const line = (over: Partial<CartLine>): CartLine => ({
  slug: "jacket",
  name: "Jacket",
  brand: "Brand",
  price: 100,
  size: null,
  image: "",
  qty: 1,
  ...over,
});

describe("cartLineKey", () => {
  it("keys on slug + size, empty for no size", () => {
    expect(cartLineKey({ slug: "j", size: "00M" })).toBe("j::00M");
    expect(cartLineKey({ slug: "j", size: null })).toBe("j::");
  });
});

describe("changeCartLineSize", () => {
  it("swaps a line's size in place when no other line collides", () => {
    const cart = [line({ size: "00M", qty: 2 })];
    expect(changeCartLineSize(cart, "jacket::00M", "00L")).toEqual([
      line({ size: "00L", qty: 2 }),
    ]);
  });

  it("merges quantities when changing into an existing (product, size) line", () => {
    const cart = [line({ size: "00M", qty: 2 }), line({ size: "00L", qty: 3 })];
    // Change the M line to L → collides with the existing L line → one merged
    // line of qty 5, M line dropped.
    expect(changeCartLineSize(cart, "jacket::00M", "00L")).toEqual([
      line({ size: "00L", qty: 5 }),
    ]);
  });

  it("does not touch a different product's line when merging", () => {
    const cart = [
      line({ size: "00M", qty: 1 }),
      line({ size: "00L", qty: 1 }),
      line({ slug: "gloves", size: "00M", qty: 4 }),
    ];
    expect(changeCartLineSize(cart, "jacket::00M", "00L")).toEqual([
      line({ size: "00L", qty: 2 }),
      line({ slug: "gloves", size: "00M", qty: 4 }),
    ]);
  });

  it("is a no-op when the size is unchanged", () => {
    const cart = [line({ size: "00M", qty: 2 })];
    expect(changeCartLineSize(cart, "jacket::00M", "00M")).toBe(cart);
  });

  it("is a no-op when the key is not in the cart", () => {
    const cart = [line({ size: "00M", qty: 2 })];
    expect(changeCartLineSize(cart, "missing::00X", "00L")).toBe(cart);
  });
});
