import { describe, expect, it } from "vitest";
import {
  shouldAnimateThemeSwitch,
  wipeEndRadius,
  wipeOriginFromRect,
} from "./theme-transition";

describe("wipeOriginFromRect", () => {
  it("returns the centre of the button rect", () => {
    const origin = wipeOriginFromRect(
      { left: 100, top: 20, width: 40, height: 40 },
      { width: 1000, height: 800 },
    );
    expect(origin).toEqual({ x: 120, y: 40 });
  });

  it("falls back to the top-right corner when no rect is given", () => {
    const origin = wipeOriginFromRect(null, { width: 1000, height: 800 });
    expect(origin).toEqual({ x: 1000, y: 0 });
  });
});

describe("wipeEndRadius", () => {
  it("reaches the furthest corner from a top-right origin", () => {
    const radius = wipeEndRadius(
      { x: 1000, y: 0 },
      { width: 1000, height: 800 },
    );
    // furthest corner is bottom-left: sqrt(1000^2 + 800^2)
    expect(radius).toBeCloseTo(Math.hypot(1000, 800));
  });

  it("reaches the furthest corner from a centred origin", () => {
    const radius = wipeEndRadius(
      { x: 500, y: 400 },
      { width: 1000, height: 800 },
    );
    expect(radius).toBeCloseTo(Math.hypot(500, 400));
  });
});

describe("shouldAnimateThemeSwitch", () => {
  it("animates only with support and motion allowed", () => {
    expect(shouldAnimateThemeSwitch(true, false)).toBe(true);
  });

  it("flips instantly when View Transitions are unsupported", () => {
    expect(shouldAnimateThemeSwitch(false, false)).toBe(false);
  });

  it("flips instantly under reduced motion even with support", () => {
    expect(shouldAnimateThemeSwitch(true, true)).toBe(false);
  });
});
