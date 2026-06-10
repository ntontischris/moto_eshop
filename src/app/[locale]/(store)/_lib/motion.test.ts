import { describe, expect, it } from "vitest";
import { clamp, velocityToSkew, velocityToTimeScale } from "./motion";

describe("clamp", () => {
  it("returns the value when inside the range", () => {
    expect(clamp(0, 10, 5)).toBe(5);
  });
  it("floors at min and ceils at max", () => {
    expect(clamp(0, 10, -3)).toBe(0);
    expect(clamp(0, 10, 42)).toBe(10);
  });
});

describe("velocityToSkew", () => {
  it("is zero at rest", () => {
    expect(velocityToSkew(0)).toBeCloseTo(0);
  });
  it("inverts the sign of the scroll velocity", () => {
    expect(velocityToSkew(220)).toBeCloseTo(-1);
    expect(velocityToSkew(-220)).toBeCloseTo(1);
  });
  it("clamps extreme flings to ±12deg", () => {
    expect(velocityToSkew(9999)).toBe(-12);
    expect(velocityToSkew(-9999)).toBe(12);
  });
});

describe("velocityToTimeScale", () => {
  it("runs at 1x when scroll is idle", () => {
    expect(velocityToTimeScale(0)).toBe(1);
  });
  it("accelerates with velocity magnitude regardless of direction", () => {
    expect(velocityToTimeScale(800)).toBeCloseTo(2);
    expect(velocityToTimeScale(-800)).toBeCloseTo(2);
  });
  it("caps acceleration at 3.5x", () => {
    expect(velocityToTimeScale(100000)).toBe(3.5);
  });
});
