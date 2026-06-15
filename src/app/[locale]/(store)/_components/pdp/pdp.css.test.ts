import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const componentsCss = readFileSync(
  new URL("../../_styles/components.css", import.meta.url),
  "utf8",
);
const pdpCss = readFileSync(new URL("./pdp.css", import.meta.url), "utf8");
const productViewSource = readFileSync(
  new URL("./product-view.tsx", import.meta.url),
  "utf8",
);

// S2 (issue #83): route-scope the PDP-only CSS off the home critical path.
// Containment seam — the four PDP prefixes are GONE from the home-critical
// sheet and PRESENT in the colocated PDP sheet, imported only by the PDP
// entry (ProductView, rendered by the [...path] catch-all). Carve by
// selector-prefix; shared light-mode groups keep their cart half here and
// duplicate the bb half into pdp.css. Gallery (v3-gal) and PLP (v3-plp) are
// out of scope and must stay.
describe("pdp css is route-scoped off the home critical path", () => {
  it("removes every PDP-only prefix from the shared components.css", () => {
    for (const prefix of [".v3-atc", ".v3-bb", ".v3-pdp", ".v3-size"]) {
      expect(componentsCss).not.toContain(prefix);
    }
  });

  it("colocates the PDP rules in pdp.css", () => {
    for (const selector of [
      ".v3-size-chip",
      ".v3-bb",
      ".v3-bb--apple",
      ".v3-bb-step",
      ".v3-bb-complete-list",
      ".v3-pdp",
      ".v3-pdp-tablist",
      ".v3-atc",
      ".v3-atc__spinner",
    ]) {
      expect(pdpCss).toContain(selector);
    }
  });

  it("moves the v3-atc keyframes with their rules", () => {
    expect(pdpCss).toContain("@keyframes v3-atc-spin");
    expect(pdpCss).toContain("@keyframes v3-atc-pop");
    // the fly-to-cart badge bump stays with the global cart shell
    expect(componentsCss).toContain("@keyframes v3-cart-bump");
  });

  it("preserves the light-mode PDP overrides in pdp.css", () => {
    expect(pdpCss).toContain('html[data-v3-mode="light"] .v3-bb-step');
    expect(pdpCss).toContain(
      'html[data-v3-mode="light"] .v3-bb-step-head strong',
    );
  });

  it("keeps out-of-scope gallery rules in components.css", () => {
    expect(componentsCss).toContain(".v3-gal");
  });

  it("loads pdp.css only from the PDP entry component", () => {
    expect(productViewSource).toContain("./pdp.css");
  });
});
