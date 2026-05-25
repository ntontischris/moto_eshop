import { describe, expect, it } from "vitest";
import { protectGlossary, restoreGlossary } from "./glossary";

describe("protectGlossary", () => {
  it("masks a brand name and a size, then restores them verbatim", () => {
    const text = "Κράνος Shoei μέγεθος XL για αναβάτες";
    const { masked, map } = protectGlossary(text, ["Shoei"]);

    expect(masked).not.toContain("Shoei");
    expect(masked).not.toContain("XL");
    expect(Object.values(map)).toContain("Shoei");
    expect(Object.values(map)).toContain("XL");

    expect(restoreGlossary(masked, map)).toBe(text);
  });

  it("matches longest term first so XXL is not partially matched by XL", () => {
    const text = "Διαθέσιμο σε XXL και XL";
    const { masked, map } = protectGlossary(text);

    // Both distinct terms must be captured.
    expect(Object.values(map)).toContain("XXL");
    expect(Object.values(map)).toContain("XL");

    // Restoring brings both back exactly, no corruption.
    expect(restoreGlossary(masked, map)).toBe(text);
    expect(masked).not.toMatch(/XXL|XL/);
  });

  it("returns an empty map and unchanged text when no terms match", () => {
    const text = "Απλό κείμενο χωρίς όρους";
    const { masked, map } = protectGlossary(text, ["Shoei"]);

    expect(masked).toBe(text);
    expect(map).toEqual({});
  });

  it("handles empty input", () => {
    const { masked, map } = protectGlossary("", ["Shoei"]);
    expect(masked).toBe("");
    expect(map).toEqual({});
  });

  it("escapes regex-special characters in brand names", () => {
    const text = "Γάντια A.R.C. (Pro) έκδοση";
    const { masked, map } = protectGlossary(text, ["A.R.C.", "(Pro)"]);

    expect(restoreGlossary(masked, map)).toBe(text);
  });
});

describe("restoreGlossary", () => {
  it("inserts terms verbatim using split/join", () => {
    const map = { "⟦0⟧": "Shoei", "⟦1⟧": "XL" };
    expect(restoreGlossary("Κράνος ⟦0⟧ μέγεθος ⟦1⟧", map)).toBe(
      "Κράνος Shoei μέγεθος XL",
    );
  });

  it("is a no-op with an empty map", () => {
    expect(restoreGlossary("unchanged", {})).toBe("unchanged");
  });
});
