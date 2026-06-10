import { describe, expect, it } from "vitest";
import { splitTextToChars } from "./char-split";

describe("splitTextToChars", () => {
  it("returns one token per character", () => {
    expect(splitTextToChars("RIDE")).toHaveLength(4);
  });

  it("preserves the visible characters in order", () => {
    const chars = splitTextToChars("AB").map((token) => token.char);
    expect(chars).toEqual(["A", "B"]);
  });

  it("flags whitespace tokens as spaces", () => {
    const tokens = splitTextToChars("A B");
    expect(tokens.map((t) => t.isSpace)).toEqual([false, true, false]);
  });

  it("keeps Greek headline characters intact", () => {
    const tokens = splitTextToChars("ΟΔΗΓΗΣΕ");
    expect(tokens.map((t) => t.char).join("")).toBe("ΟΔΗΓΗΣΕ");
    expect(tokens.every((t) => !t.isSpace)).toBe(true);
  });

  it("splits by Unicode code point, not UTF-16 unit", () => {
    // An emoji is a surrogate pair; spread keeps it as one token.
    expect(splitTextToChars("🏍")).toHaveLength(1);
  });

  it("returns no tokens for an empty string", () => {
    expect(splitTextToChars("")).toEqual([]);
  });
});
