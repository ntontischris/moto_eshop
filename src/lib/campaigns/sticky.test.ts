import { describe, it, expect } from "vitest";
import { hashToUnit, variantBucket } from "./sticky";

describe("sticky", () => {
  it("returns a value in [0, 1)", () => {
    const u = hashToUnit("abc");
    expect(u).toBeGreaterThanOrEqual(0);
    expect(u).toBeLessThan(1);
  });

  it("is deterministic for the same session + campaign", () => {
    expect(variantBucket("sess", "camp")).toBe(variantBucket("sess", "camp"));
  });

  it("differs across sessions", () => {
    expect(variantBucket("a", "camp")).not.toBe(variantBucket("b", "camp"));
  });
});
