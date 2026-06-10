import { describe, expect, it } from "vitest";
import { editorialZoomScale, splitTextToWords } from "./word-split";

describe("splitTextToWords", () => {
  it("returns one token per word", () => {
    expect(splitTextToWords("Protection that looks")).toHaveLength(3);
  });

  it("preserves the visible words in order", () => {
    const words = splitTextToWords("Ride faster").map((t) => t.word);
    expect(words).toEqual(["Ride", "faster"]);
  });

  it("collapses runs of whitespace and ignores leading/trailing gaps", () => {
    expect(splitTextToWords("  a   b  ").map((t) => t.word)).toEqual([
      "a",
      "b",
    ]);
  });

  it("flags <em>-wrapped words as accent and strips the markers", () => {
    const tokens = splitTextToWords("sells <em>confidence</em> always");
    expect(tokens.map((t) => t.isAccent)).toEqual([false, true, false]);
    expect(tokens[1].word).toBe("confidence");
  });

  it("keeps Greek words intact", () => {
    const tokens = splitTextToWords("Προστασία που δείχνει");
    expect(tokens.map((t) => t.word)).toEqual(["Προστασία", "που", "δείχνει"]);
  });

  it("returns no tokens for an empty string", () => {
    expect(splitTextToWords("")).toEqual([]);
  });
});

describe("editorialZoomScale", () => {
  it("returns the entry scale at progress 0", () => {
    expect(editorialZoomScale(0)).toBeCloseTo(1.22);
  });

  it("returns the rest scale at progress 1", () => {
    expect(editorialZoomScale(1)).toBeCloseTo(1);
  });

  it("interpolates linearly at the midpoint", () => {
    expect(editorialZoomScale(0.5)).toBeCloseTo(1.11);
  });

  it("clamps progress below 0 to the entry scale", () => {
    expect(editorialZoomScale(-0.5)).toBeCloseTo(1.22);
  });

  it("clamps progress above 1 to the rest scale", () => {
    expect(editorialZoomScale(1.5)).toBeCloseTo(1);
  });

  it("honours custom from/to bounds", () => {
    expect(editorialZoomScale(0, 1.4, 1)).toBeCloseTo(1.4);
    expect(editorialZoomScale(1, 1.4, 1)).toBeCloseTo(1);
  });
});
