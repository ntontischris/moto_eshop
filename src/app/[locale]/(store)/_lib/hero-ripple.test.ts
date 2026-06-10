import { describe, expect, it } from "vitest";
import {
  cappedDevicePixelRatio,
  pointerSpeedToStrength,
  scrollVelocityToChroma,
  shouldMountHeroRipple,
} from "./hero-ripple";

const desktop = {
  isFinePointer: true,
  prefersReducedMotion: false,
  viewportWidth: 1440,
};

describe("shouldMountHeroRipple", () => {
  it("mounts on a fine-pointer desktop with motion allowed", () => {
    expect(shouldMountHeroRipple(desktop)).toBe(true);
  });

  it("never mounts on touch / coarse pointer", () => {
    expect(shouldMountHeroRipple({ ...desktop, isFinePointer: false })).toBe(
      false,
    );
  });

  it("never mounts under reduced motion", () => {
    expect(
      shouldMountHeroRipple({ ...desktop, prefersReducedMotion: true }),
    ).toBe(false);
  });

  it("never mounts below the desktop width threshold", () => {
    expect(shouldMountHeroRipple({ ...desktop, viewportWidth: 1023 })).toBe(
      false,
    );
    expect(shouldMountHeroRipple({ ...desktop, viewportWidth: 1024 })).toBe(
      true,
    );
  });
});

describe("cappedDevicePixelRatio", () => {
  it("caps high-DPR screens at 1.5", () => {
    expect(cappedDevicePixelRatio(3)).toBe(1.5);
    expect(cappedDevicePixelRatio(2)).toBe(1.5);
  });

  it("passes through standard ratios", () => {
    expect(cappedDevicePixelRatio(1)).toBe(1);
    expect(cappedDevicePixelRatio(1.25)).toBe(1.25);
  });

  it("falls back to 1 for invalid input", () => {
    expect(cappedDevicePixelRatio(Number.NaN)).toBe(1);
    expect(cappedDevicePixelRatio(0)).toBe(1);
    expect(cappedDevicePixelRatio(Number.POSITIVE_INFINITY)).toBe(1);
  });
});

describe("pointerSpeedToStrength", () => {
  it("is zero when the pointer does not move", () => {
    expect(pointerSpeedToStrength({ x: 0.5, y: 0.5 }, { x: 0.5, y: 0.5 })).toBe(
      0,
    );
  });

  it("clamps fast movement to 1", () => {
    expect(pointerSpeedToStrength({ x: 0, y: 0 }, { x: 1, y: 1 })).toBe(1);
  });

  it("scales with small movement", () => {
    const s = pointerSpeedToStrength({ x: 0, y: 0 }, { x: 0.01, y: 0 });
    expect(s).toBeGreaterThan(0);
    expect(s).toBeLessThan(1);
  });
});

describe("scrollVelocityToChroma", () => {
  it("is zero at rest", () => {
    expect(scrollVelocityToChroma(0)).toBe(0);
  });

  it("uses magnitude regardless of scroll direction", () => {
    expect(scrollVelocityToChroma(700)).toBe(scrollVelocityToChroma(-700));
    expect(scrollVelocityToChroma(700)).toBeCloseTo(2);
  });

  it("clamps to the max of 8", () => {
    expect(scrollVelocityToChroma(100000)).toBe(8);
  });
});
