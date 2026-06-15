import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const componentsCss = readFileSync(
  new URL("../../_styles/components.css", import.meta.url),
  "utf8",
);
const railCss = readFileSync(
  new URL("./product-rail.css", import.meta.url),
  "utf8",
);
const railSource = readFileSync(
  new URL("./product-rail.tsx", import.meta.url),
  "utf8",
);
const homePageSource = readFileSync(
  new URL("../../page.tsx", import.meta.url),
  "utf8",
);

// S5a (issue #86, Lever 2): the below-the-fold product rail is the home-LCP
// lever. Its nour-gallery CSS is carved out of the render-blocking monolith
// into a sheet colocated with the component, and the section is loaded via
// next/dynamic so that sheet code-splits off the home critical path. The hero
// and shell chrome stay critically styled.
describe("product rail css is carved out of the home-critical sheet", () => {
  it("removes every nour-gallery selector from the shared components.css", () => {
    for (const selector of [
      "/* === nour inspired product gallery === */",
      ".v3-rail--nour-gallery",
      ".v3-gallery-grid",
      ".v3-gallery-card",
      ".v3-gallery-plate",
      ".v3-gallery-shot", // .v3-product-shot twin stays global
      ".v3-gallery-rank",
      ".v3-gallery-info",
      ".v3-gallery-name",
      ".v3-gallery-footer",
      ".v3-gallery-cta",
      ".v3-gallery-dot",
    ]) {
      expect(componentsCss).not.toContain(selector);
    }
  });

  it("colocates the gallery rules in product-rail.css", () => {
    for (const selector of [
      "/* === nour inspired product gallery === */",
      ".v3-rail--nour-gallery",
      ".v3-gallery-grid",
      ".v3-gallery-grid.is-dragging",
      ".v3-gallery-card",
      ".v3-gallery-card::after",
      ".v3-gallery-plate img",
      ".v3-gallery-shot--swap",
      ".v3-gallery-card.is-zoom.is-hot .v3-gallery-shot--primary",
      ".v3-gallery-cta",
    ]) {
      expect(railCss).toContain(selector);
    }
  });

  it("keeps the shared commerce card + price widget rules global", () => {
    // .v3-product-shot* is the shared commerce product card (every PLP/PDP/
    // search route); .v3-odometer* is the shared price widget. Neither may
    // leave the global sheet onto a home-only chunk.
    for (const keep of [
      ".v3-product-shot",
      ".v3-product-shot--swap",
      ".v3-odometer",
      ".v3-odometer-digit",
    ]) {
      expect(componentsCss).toContain(keep);
    }
    // ...and they must NOT have leaked into the home-only rail sheet.
    expect(railCss).not.toContain(".v3-product-shot");
    expect(railCss).not.toContain(".v3-odometer");
  });

  it("keeps the shell-shared base rail + reconstructed rules global", () => {
    // bare .v3-rail also styles the TrackRail HUD mounted by the shell on
    // every route; .v3-rail--reconstructed is shared with the offers section.
    expect(componentsCss).toContain(".v3-rail-track");
    expect(componentsCss).toContain(".v3-rail--reconstructed");
  });

  it("imports the colocated sheet from the component", () => {
    expect(railSource).toContain("./product-rail.css");
  });

  it("defers the product rail section via next/dynamic on the home page", () => {
    expect(homePageSource).toContain('import dynamic from "next/dynamic"');
    expect(homePageSource).toContain('./_components/home/product-rail"');
    expect(homePageSource).toContain("dynamic(");
  });
});
