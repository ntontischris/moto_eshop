import { describe, expect, it } from "vitest";
import {
  normalizeSizeCode,
  sizeStockState,
  buildSizeVariants,
} from "./size-availability";

describe("normalizeSizeCode", () => {
  it("strips leading-zero padding from clean codes (ADR 0009)", () => {
    expect(normalizeSizeCode("00S")).toBe("S");
    expect(normalizeSizeCode("00M")).toBe("M");
    expect(normalizeSizeCode("00L")).toBe("L");
    expect(normalizeSizeCode("0XS")).toBe("XS");
    expect(normalizeSizeCode("0XL")).toBe("XL");
    expect(normalizeSizeCode("044")).toBe("44");
    expect(normalizeSizeCode("042")).toBe("42");
  });

  it("shows combined/range codes verbatim (never guesses a split)", () => {
    expect(normalizeSizeCode("LXL")).toBe("LXL");
    expect(normalizeSizeCode("39-42")).toBe("39-42");
    expect(normalizeSizeCode("2-3XL")).toBe("2-3XL");
  });

  it("returns empty string untouched", () => {
    expect(normalizeSizeCode("")).toBe("");
  });

  it("never collapses an all-zero code to empty (keeps it verbatim)", () => {
    expect(normalizeSizeCode("000")).toBe("000");
  });
});

describe("sizeStockState — boundaries at 0/1/3/4", () => {
  it("is out at zero (and below)", () => {
    expect(sizeStockState(0)).toBe("out");
    expect(sizeStockState(-2)).toBe("out");
  });

  it("is limited for 1..3", () => {
    expect(sizeStockState(1)).toBe("limited");
    expect(sizeStockState(3)).toBe("limited");
  });

  it("is available above 3", () => {
    expect(sizeStockState(4)).toBe("available");
    expect(sizeStockState(40)).toBe("available");
  });
});

describe("buildSizeVariants", () => {
  it("maps each row to raw code, display size, and three-state availability", () => {
    expect(
      buildSizeVariants([
        { size: "00M", available: 5 },
        { size: "00L", available: 2 },
        { size: "0XL", available: 0 },
      ]),
    ).toEqual([
      { code: "00M", display: "M", available: 5, state: "available" },
      { code: "00L", display: "L", available: 2, state: "limited" },
      { code: "0XL", display: "XL", available: 0, state: "out" },
    ]);
  });

  it("drops null and empty-string sizes (the no-variant sentinel)", () => {
    expect(
      buildSizeVariants([
        { size: null, available: 9 },
        { size: "", available: 9 },
        { size: "00S", available: 1 },
      ]),
    ).toEqual([{ code: "00S", display: "S", available: 1, state: "limited" }]);
  });

  it("returns no variants when a product only has the empty-string size", () => {
    expect(buildSizeVariants([{ size: "", available: 12 }])).toEqual([]);
  });

  it("sums duplicate rows for the same code before deciding state", () => {
    expect(
      buildSizeVariants([
        { size: "044", available: 2 },
        { size: "044", available: 3 },
      ]),
    ).toEqual([
      { code: "044", display: "44", available: 5, state: "available" },
    ]);
  });

  it("treats a null available as zero", () => {
    expect(buildSizeVariants([{ size: "00M", available: null }])).toEqual([
      { code: "00M", display: "M", available: 0, state: "out" },
    ]);
  });
});
