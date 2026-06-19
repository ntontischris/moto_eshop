import { describe, expect, it } from "vitest";
import { cartLineKey } from "./cart-line";

describe("cartLineKey", () => {
  it("keys on slug + size, empty for no size", () => {
    expect(cartLineKey({ slug: "j", size: "00M" })).toBe("j::00M");
    expect(cartLineKey({ slug: "j", size: null })).toBe("j::");
  });
});
