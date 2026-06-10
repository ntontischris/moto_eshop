import { describe, expect, it } from "vitest";
import { decideDraw } from "./trust-draw";

describe("decideDraw", () => {
  it("draws instantly under reduced motion, regardless of visibility", () => {
    expect(
      decideDraw({
        isIntersecting: false,
        hasDrawn: false,
        prefersReducedMotion: true,
      }),
    ).toBe("instant");
  });

  it("animates once when first revealed", () => {
    expect(
      decideDraw({
        isIntersecting: true,
        hasDrawn: false,
        prefersReducedMotion: false,
      }),
    ).toBe("animate");
  });

  it("stays idle while still off-screen", () => {
    expect(
      decideDraw({
        isIntersecting: false,
        hasDrawn: false,
        prefersReducedMotion: false,
      }),
    ).toBe("idle");
  });

  it("never re-animates once already drawn", () => {
    expect(
      decideDraw({
        isIntersecting: true,
        hasDrawn: true,
        prefersReducedMotion: false,
      }),
    ).toBe("done");
  });
});
