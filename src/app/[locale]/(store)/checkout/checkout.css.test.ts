import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const componentsCss = readFileSync(
  new URL("../_styles/components.css", import.meta.url),
  "utf8",
);
const checkoutCss = readFileSync(
  new URL("./checkout.css", import.meta.url),
  "utf8",
);
const pageSource = readFileSync(new URL("./page.tsx", import.meta.url), "utf8");

// S1 (issue #82): route-scope the checkout-only CSS off the home critical path.
// Containment seam — moved prefixes are GONE from the home-critical sheet and
// PRESENT in the colocated checkout sheet. Carve by selector-prefix (v3-co-),
// keeping the shared cart-page (v3-cart-) rules where they are until S4.
describe("checkout css is route-scoped off the home critical path", () => {
  it("removes every checkout-only (.v3-co-) rule from the shared components.css", () => {
    expect(componentsCss).not.toContain(".v3-co-");
  });

  it("colocates the checkout rules in checkout.css", () => {
    for (const selector of [
      ".v3-co--apple",
      ".v3-co-grid",
      ".v3-co-form",
      ".v3-co-field",
      ".v3-co-pay-opt",
      ".v3-co-confidence",
      ".v3-co-err",
      ".v3-co-sum",
      ".v3-co-title",
      ".v3-co-place",
    ]) {
      expect(checkoutCss).toContain(selector);
    }
  });

  it("preserves the light-mode and responsive checkout overrides", () => {
    expect(checkoutCss).toContain('html[data-v3-mode="light"] .v3-co-sum');
    expect(checkoutCss).toContain(".v3-co-fields");
  });

  it("keeps the shared cart-page rules in components.css (cart untouched until S4)", () => {
    expect(componentsCss).toContain(".v3-cart-sum");
    expect(componentsCss).toContain(".v3-cart-title");
  });

  it("loads checkout.css only from the checkout segment", () => {
    expect(pageSource).toContain("./checkout.css");
  });
});
