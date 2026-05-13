import { describe, expect, it } from "vitest";
import { frameIndexForProgress, opacityForRange } from "./scroll-progress";

describe("frameIndexForProgress", () => {
  it("returns 0 when progress is 0", () => {
    expect(frameIndexForProgress(0, 120)).toBe(0);
  });

  it("returns last frame when progress is 1", () => {
    expect(frameIndexForProgress(1, 120)).toBe(119);
  });

  it("clamps below 0 to 0", () => {
    expect(frameIndexForProgress(-0.5, 120)).toBe(0);
  });

  it("clamps above 1 to last frame", () => {
    expect(frameIndexForProgress(1.5, 120)).toBe(119);
  });

  it("maps 0.5 to middle frame", () => {
    expect(frameIndexForProgress(0.5, 120)).toBe(60);
  });
});

describe("opacityForRange", () => {
  it("returns 0 below the range", () => {
    expect(opacityForRange(0.1, 0.2, 0.4)).toBe(0);
  });

  it("returns 1 above the range", () => {
    expect(opacityForRange(0.6, 0.2, 0.4)).toBe(1);
  });

  it("returns 0.5 at midpoint of range", () => {
    expect(opacityForRange(0.3, 0.2, 0.4)).toBeCloseTo(0.5, 5);
  });
});
