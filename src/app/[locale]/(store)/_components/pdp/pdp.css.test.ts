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
const gallerySource = readFileSync(
  new URL("./product-gallery.tsx", import.meta.url),
  "utf8",
);
const buyBoxSource = readFileSync(
  new URL("./buy-box.tsx", import.meta.url),
  "utf8",
);
const sizeSelectorSource = readFileSync(
  new URL("./size-selector.tsx", import.meta.url),
  "utf8",
);
const pdpClientSource = readFileSync(
  new URL("../../product/[slug]/pdp-client.tsx", import.meta.url),
  "utf8",
);
const packageJson = readFileSync(
  new URL("../../../../../../package.json", import.meta.url),
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

// Cycle 1 / issue #123 — PDP gap-closers (presentation only).
describe("pdp gap-closers: native lightbox + mobile sticky add-to-cart", () => {
  it("opens the gallery in a native <dialog> lightbox — no JS lib", () => {
    expect(gallerySource).toContain("<dialog");
    expect(gallerySource).toContain("showModal()");
    // gap-closer ships zero new runtime deps (ADR 0008).
    expect(packageJson).not.toMatch(
      /photoswipe|fancybox|yet-another|lightbox/i,
    );
  });

  it("makes the lightbox keyboard-operable (arrows) and restores focus", () => {
    expect(gallerySource).toContain("ArrowRight");
    expect(gallerySource).toContain("ArrowLeft");
    // ESC-close is native to <dialog>; focus is restored on the onClose path.
    expect(gallerySource).toContain("onClose");
    expect(gallerySource).toContain("triggerRef.current?.focus()");
  });

  it("styles + reduced-motion-guards the lightbox in route-scoped pdp.css", () => {
    expect(pdpCss).toContain(".v3-gal-dialog");
    expect(pdpCss).toContain("::backdrop");
    expect(pdpCss).toContain("@keyframes v3-gal-dialog-in");
    expect(pdpCss).toMatch(
      /@media \(prefers-reduced-motion: reduce\)[\s\S]*\.v3-gal-dialog\[open\][\s\S]*animation: none/,
    );
  });

  it("wires the mobile sticky bar to the EXISTING add-to-cart (one handler)", () => {
    expect(buyBoxSource).toContain("v3-bb-stickybar");
    // exactly one onAdd definition — the sticky bar reuses it, no duplicate.
    expect(buyBoxSource.match(/const onAdd =/g)?.length).toBe(1);
    expect(buyBoxSource.match(/onClick={onAdd}/g)?.length).toBe(2);
  });

  it("guards the sticky add-to-cart rule with a max-width:768px media query", () => {
    expect(pdpCss).toMatch(
      /@media \(max-width: 768px\)[\s\S]*\.v3-bb-stickybar/,
    );
    // base state is display:none so desktop is unaffected.
    expect(pdpCss).toMatch(/\.v3-bb-stickybar \{\s*display: none;/);
    expect(pdpCss).toContain("position: sticky");
    // sticky-bar slide honors reduced motion.
    expect(pdpCss).toMatch(
      /@media \(prefers-reduced-motion: reduce\)[\s\S]*\.v3-bb-stickybar[\s\S]*transition: none/,
    );
  });
});

// Cycle 1 / issue #124 — inert reserve slots (markers only, no behaviour).
describe("pdp inert reserve slots are present, marked, and layout-neutral", () => {
  it("activates the per-size stock badge slot (S-2.8 shipped)", () => {
    expect(sizeSelectorSource).toContain('data-slot="size-stock"');
    expect(sizeSelectorSource).toContain("v3-size-stock");
    // The slot is no longer inert: it renders the three-state availability
    // label and tags the chip with its state for styling/OOS-disable.
    expect(sizeSelectorSource).toContain("SIZE_STATE_LABEL");
    expect(sizeSelectorSource).toContain("data-size-state");
  });

  it("reserves the bike-compatibility badge slot in the buy-box (S-4.4)", () => {
    expect(buyBoxSource).toContain('data-slot="compat-badge"');
    expect(buyBoxSource).toContain("v3-bb-compat");
    expect(buyBoxSource).toContain("S-4.4");
  });

  it("reserves the inert Reviews tab + panel (S-2.9)", () => {
    expect(pdpClientSource).toContain('"reviews"');
    expect(pdpClientSource).toContain('data-slot="reviews-tab"');
    expect(pdpClientSource).toContain('data-slot="reviews"');
    expect(pdpClientSource).toContain("v3-pdp-reviews");
    expect(pdpClientSource).toContain("S-2.9");
  });

  it("collapses every empty slot to zero box so layout is unaffected", () => {
    expect(pdpCss).toContain(".v3-size-stock:empty");
    expect(pdpCss).toContain(".v3-bb-compat:empty");
    expect(pdpCss).toContain(".v3-pdp-reviews:empty");
    expect(pdpCss).toMatch(
      /\.v3-size-stock:empty[\s\S]*\.v3-pdp-reviews:empty \{\s*display: none;/,
    );
  });

  it("keeps the still-inert compat slot aria-hidden with no interactive children", () => {
    // compat slot is a bare aria-hidden marker div (no buttons/links inside).
    expect(buyBoxSource).toMatch(
      /className="v3-bb-compat"[\s\S]*?data-slot="compat-badge"[\s\S]*?aria-hidden="true"[\s\S]*?\/>/,
    );
  });
});
