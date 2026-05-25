import { describe, it, expect } from "vitest";
import { applyTranslation } from "./products";

describe("applyTranslation", () => {
  const base = { name: "Κράνη", description: "Ελληνική περιγραφή", price: 100 };

  it("overlays translated name and description", () => {
    const result = applyTranslation(base, {
      name: "Helmet",
      description: "English description",
    });
    expect(result.name).toBe("Helmet");
    expect(result.description).toBe("English description");
    expect(result.price).toBe(100);
  });

  it("falls back to source when a translated field is null", () => {
    const result = applyTranslation(base, {
      name: "Helmet",
      description: null,
    });
    expect(result.name).toBe("Helmet");
    expect(result.description).toBe("Ελληνική περιγραφή");
  });

  it("falls back to source when a translated field is missing", () => {
    const result = applyTranslation(base, { name: "Helmet" });
    expect(result.name).toBe("Helmet");
    expect(result.description).toBe("Ελληνική περιγραφή");
  });

  it("returns base unchanged when tr is undefined", () => {
    expect(applyTranslation(base, undefined)).toEqual(base);
  });

  it("returns base unchanged when tr is null", () => {
    expect(applyTranslation(base, null)).toEqual(base);
  });

  it("normalizes a missing source description to null", () => {
    const noDesc: { name: string; description?: string | null } = {
      name: "Κράνη",
    };
    const result = applyTranslation(noDesc, { name: "Helmet" });
    expect(result.name).toBe("Helmet");
    expect(result.description).toBeNull();
  });
});
