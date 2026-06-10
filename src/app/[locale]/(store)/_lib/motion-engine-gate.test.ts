import { describe, expect, it } from "vitest";
import {
  shouldAnimateReveal,
  shouldRunMotionEngine,
} from "./motion-engine-gate";

const desktop = { isFinePointer: true, prefersReducedMotion: false };

describe("shouldRunMotionEngine", () => {
  it("runs on a fine-pointer device with motion allowed", () => {
    expect(shouldRunMotionEngine(desktop)).toBe(true);
  });

  it("never runs on touch / coarse pointer", () => {
    expect(shouldRunMotionEngine({ ...desktop, isFinePointer: false })).toBe(
      false,
    );
  });

  it("never runs under reduced motion", () => {
    expect(
      shouldRunMotionEngine({ ...desktop, prefersReducedMotion: true }),
    ).toBe(false);
  });
});

describe("shouldAnimateReveal", () => {
  it("animates groups below the fold at engine start", () => {
    expect(shouldAnimateReveal(false)).toBe(true);
  });

  it("skips groups already in the viewport (above the fold)", () => {
    expect(shouldAnimateReveal(true)).toBe(false);
  });
});
