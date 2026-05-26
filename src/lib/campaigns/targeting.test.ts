import { describe, it, expect } from "vitest";
import { parseRules, matchesRules } from "./targeting";
import type { Signals } from "./signals";

const sig = (over: Partial<Signals> = {}): Signals => ({
  source: "instagram",
  utm: {},
  device: "mobile",
  country: "GR",
  isReturning: false,
  bucket: 0.5,
  ...over,
});

describe("targeting", () => {
  it("parseRules drops invalid entries", () => {
    expect(
      parseRules([
        { field: "source", op: "eq", value: "x" },
        { bad: true },
        "nope",
      ]),
    ).toHaveLength(1);
  });

  it("matches an eq condition", () => {
    expect(
      matchesRules([{ field: "source", op: "eq", value: "instagram" }], sig()),
    ).toBe(true);
  });

  it("ANDs across conditions", () => {
    expect(
      matchesRules(
        [
          { field: "source", op: "eq", value: "instagram" },
          { field: "device", op: "eq", value: "mobile" },
        ],
        sig(),
      ),
    ).toBe(true);
    expect(
      matchesRules(
        [
          { field: "source", op: "eq", value: "instagram" },
          { field: "device", op: "eq", value: "desktop" },
        ],
        sig(),
      ),
    ).toBe(false);
  });

  it("supports the in operator", () => {
    expect(
      matchesRules(
        [{ field: "country", op: "in", value: ["GR", "CY"] }],
        sig(),
      ),
    ).toBe(true);
    expect(
      matchesRules([{ field: "country", op: "in", value: ["US"] }], sig()),
    ).toBe(false);
  });

  it("empty rules never match", () => {
    expect(matchesRules([], sig())).toBe(false);
  });
});
