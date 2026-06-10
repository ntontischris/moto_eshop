import { describe, expect, it } from "vitest";
import {
  TUNNEL_TAIL,
  shouldPinTunnel,
  tunnelProgress,
  tunnelScrollDistance,
} from "./gear-tunnel";

describe("tunnelScrollDistance", () => {
  it("is the track overflow past the viewport plus the tail gutter", () => {
    expect(tunnelScrollDistance(3000, 1200)).toBe(3000 - 1200 + TUNNEL_TAIL);
  });
  it("never goes negative when the track fits the viewport", () => {
    expect(tunnelScrollDistance(800, 1200)).toBe(0);
  });
});

describe("tunnelProgress", () => {
  it("is zero at the start and one at full travel", () => {
    expect(tunnelProgress(0, 2000)).toBe(0);
    expect(tunnelProgress(2000, 2000)).toBe(1);
  });
  it("is linear in between", () => {
    expect(tunnelProgress(500, 2000)).toBeCloseTo(0.25);
  });
  it("clamps overscroll into [0, 1]", () => {
    expect(tunnelProgress(-50, 2000)).toBe(0);
    expect(tunnelProgress(9999, 2000)).toBe(1);
  });
  it("reports complete when there is nothing to scroll", () => {
    expect(tunnelProgress(0, 0)).toBe(1);
  });
});

describe("shouldPinTunnel", () => {
  const base = {
    isWideViewport: true,
    hasFinePointer: true,
    prefersReducedMotion: false,
  };
  it("pins on a wide, fine-pointer, motion-OK device", () => {
    expect(shouldPinTunnel(base)).toBe(true);
  });
  it("falls back to the rail on narrow viewports", () => {
    expect(shouldPinTunnel({ ...base, isWideViewport: false })).toBe(false);
  });
  it("falls back to the rail on touch / coarse pointers", () => {
    expect(shouldPinTunnel({ ...base, hasFinePointer: false })).toBe(false);
  });
  it("falls back to the rail under reduced-motion", () => {
    expect(shouldPinTunnel({ ...base, prefersReducedMotion: true })).toBe(
      false,
    );
  });
});
