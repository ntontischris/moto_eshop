import { describe, it, expect } from "vitest";
import { buildSystemPrompt } from "./build-system-prompt";
import type { StorefrontState } from "../types";

const state: StorefrontState = {
  locale: "el",
  pathname: "/category/kranh--touring",
  cart: { itemCount: 2, totalCents: 24999, currency: "EUR" },
  bike: { brand: "Yamaha", model: "MT-09", year: 2023, cc: 890 },
  wishlistCount: 3,
  ridingStyle: "touring",
  notes: "Προτιμά μαύρα. Άνοιξε εργασίες στο 1500.",
};

describe("buildSystemPrompt", () => {
  it("starts with the Greek base persona", () => {
    const out = buildSystemPrompt(state);
    expect(out).toContain('Είσαι ο "Πιτ"');
  });

  it("includes the multilingual addendum", () => {
    const out = buildSystemPrompt(state);
    expect(out).toContain("Multilingual behavior");
    expect(out).toContain("Greeklish");
  });

  it("substitutes site_locale in the addendum", () => {
    const out = buildSystemPrompt(state);
    expect(out).toContain("start in el");
    expect(out).not.toContain("{site_locale}");
  });

  it("includes injected context with all fields filled", () => {
    const out = buildSystemPrompt(state);
    expect(out).toContain("Γλώσσα σελίδας: el");
    expect(out).toContain("Τρέχουσα σελίδα: /category/kranh--touring");
    expect(out).toContain("Καλάθι: 2 προϊόντα");
    expect(out).toContain("249,99 EUR");
    expect(out).toContain("Yamaha MT-09 2023 (890cc)");
    expect(out).toContain("Wishlist: 3");
    expect(out).toContain("touring");
    expect(out).toContain("μαύρα");
  });

  it("renders 'καμία' when bike is null", () => {
    const out = buildSystemPrompt({ ...state, bike: null });
    expect(out).toContain("Καταχωρημένη μηχανή: καμία");
  });

  it("renders 'άγνωστο' when riding_style is null", () => {
    const out = buildSystemPrompt({ ...state, ridingStyle: null });
    expect(out).toContain("Στυλ οδήγησης (αν ξέρουμε): άγνωστο");
  });

  it("omits notes line cleanly when notes is null", () => {
    const out = buildSystemPrompt({ ...state, notes: null });
    expect(out).toContain("Σημειώσεις από προηγούμενες συνομιλίες: —");
  });

  it("orders sections: base, addendum, context", () => {
    const out = buildSystemPrompt(state);
    const baseIdx = out.indexOf("Είσαι ο");
    const mlIdx = out.indexOf("Multilingual behavior");
    const ctxIdx = out.indexOf("Πλαίσιο τώρα");
    expect(baseIdx).toBeGreaterThan(-1);
    expect(mlIdx).toBeGreaterThan(baseIdx);
    expect(ctxIdx).toBeGreaterThan(mlIdx);
  });
});
