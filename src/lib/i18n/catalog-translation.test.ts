import { describe, expect, it } from "vitest";
import { chunk, needsTranslation, sourceHash } from "./catalog-translation";

describe("sourceHash", () => {
  it("is deterministic for identical input", () => {
    const a = sourceHash({ name: "Κράνος", description: "περιγραφή" });
    const b = sourceHash({ name: "Κράνος", description: "περιγραφή" });
    expect(a).toBe(b);
  });

  it("treats null and undefined description identically", () => {
    expect(sourceHash({ name: "X", description: null })).toBe(
      sourceHash({ name: "X" }),
    );
  });

  it("changes when the name changes", () => {
    expect(sourceHash({ name: "A" })).not.toBe(sourceHash({ name: "B" }));
  });

  it("changes when the description changes", () => {
    expect(sourceHash({ name: "A", description: "one" })).not.toBe(
      sourceHash({ name: "A", description: "two" }),
    );
  });
});

describe("needsTranslation", () => {
  const src = { name: "Κράνος", description: "περιγραφή" };

  it("returns true when no existing translation", () => {
    expect(needsTranslation(src, null)).toBe(true);
    expect(needsTranslation(src, undefined)).toBe(true);
  });

  it("returns true when the stored hash differs", () => {
    expect(needsTranslation(src, { source_hash: "stale" })).toBe(true);
  });

  it("returns true when the stored hash is missing", () => {
    expect(needsTranslation(src, { source_hash: null })).toBe(true);
  });

  it("returns false when the stored hash matches", () => {
    expect(needsTranslation(src, { source_hash: sourceHash(src) })).toBe(false);
  });
});

describe("chunk", () => {
  it("splits evenly", () => {
    expect(chunk([1, 2, 3, 4], 2)).toEqual([
      [1, 2],
      [3, 4],
    ]);
  });

  it("keeps a final partial chunk (remainder)", () => {
    expect(chunk([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]]);
  });

  it("returns an empty array for empty input", () => {
    expect(chunk([], 3)).toEqual([]);
  });

  it("returns a single chunk when size exceeds length", () => {
    expect(chunk([1, 2], 10)).toEqual([[1, 2]]);
  });

  it("throws for non-positive size", () => {
    expect(() => chunk([1], 0)).toThrow();
    expect(() => chunk([1], -1)).toThrow();
  });
});
