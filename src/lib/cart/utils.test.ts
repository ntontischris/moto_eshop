import { describe, it, expect } from "vitest";
import {
  FREE_SHIPPING_THRESHOLD,
  DEFAULT_SHIPPING_ESTIMATE,
  SHIPPING_RATES,
  calculateShipping,
} from "./utils";

describe("shipping invariant", () => {
  it("exposes a single source of truth for the threshold and estimate", () => {
    expect(FREE_SHIPPING_THRESHOLD).toBe(50);
    expect(DEFAULT_SHIPPING_ESTIMATE).toBe(3.5);
  });

  it("charges the method rate below the free-shipping threshold", () => {
    expect(calculateShipping(10, "elta")).toBe(SHIPPING_RATES.elta.price);
    expect(calculateShipping(49.99, "acs_standard")).toBe(
      SHIPPING_RATES.acs_standard.price,
    );
  });

  it("is free at or above the threshold for standard methods", () => {
    expect(calculateShipping(FREE_SHIPPING_THRESHOLD, "elta")).toBe(0);
    expect(calculateShipping(120, "acs_standard")).toBe(0);
  });

  it("never makes express free, even above the threshold", () => {
    expect(calculateShipping(500, "acs_express")).toBe(
      SHIPPING_RATES.acs_express.price,
    );
  });
});
