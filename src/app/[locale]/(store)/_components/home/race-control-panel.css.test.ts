import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const componentsCss = readFileSync(
  new URL("../../_styles/components.css", import.meta.url),
  "utf8",
);
const rideCss = readFileSync(
  new URL("./race-control-panel.css", import.meta.url),
  "utf8",
);
const rideSource = readFileSync(
  new URL("./race-control-panel.tsx", import.meta.url),
  "utf8",
);
const homePageSource = readFileSync(
  new URL("../../page.tsx", import.meta.url),
  "utf8",
);

// S5b (issue #87, Lever 2): the ride-cinema / ride-selector section sits below
// the ~92vh hero, so it is the home-LCP lever after the product rail. Its
// `v3-ride-*` CSS is carved out of the render-blocking monolith into a sheet
// colocated with the component, and the section is loaded via next/dynamic so
// that sheet code-splits off the home critical path. The hero stays critically
// styled.
describe("ride-cinema css is carved out of the home-critical sheet", () => {
  it("removes every v3-ride rule from the shared components.css", () => {
    // Total containment: no v3-ride selector, keyframe, or animation reference
    // may remain on the render-blocking monolith.
    expect(componentsCss).not.toContain("v3-ride");
  });

  it("colocates the base + cinema + tabs + trust rules in race-control-panel.css", () => {
    for (const selector of [
      ".v3-ride-selector {",
      ".v3-ride-selector-inner {",
      ".v3-ride-head {",
      ".v3-ride-all {",
      ".v3-ride-cinema {",
      ".v3-ride-focus {",
      '.v3-ride-focus-layer[data-active="true"] {',
      ".v3-ride-focus-copy strong {",
      ".v3-ride-focus-spec {",
      ".v3-ride-tabs {",
      ".v3-ride-tab {",
      '.v3-ride-tab[data-active="true"] .v3-ride-tab-progress {',
      ".v3-ride-tab-thumb {",
      ".v3-ride-trust {",
    ]) {
      expect(rideCss).toContain(selector);
    }
  });

  it("colocates the keyframes, light-mode, and responsive ride rules", () => {
    for (const fragment of [
      "@keyframes v3-ride-reveal {",
      "@keyframes v3-ride-tab-progress {",
      'html[data-v3-mode="light"] .v3-ride-selector {',
      'html[data-v3-mode="light"] .v3-ride-tabs {',
      "@media (prefers-reduced-motion: reduce)",
      "@media (max-width: 1180px)",
      "@media (max-width: 680px)",
    ]) {
      expect(rideCss).toContain(fragment);
    }
  });

  it("splits fused comma-groups: ride half moves, sibling sections stay global", () => {
    // These selectors share a rule with v3-ride in the monolith. The ride half
    // is carved out; the sibling-section half must remain on the global sheet.
    for (const keepGlobal of [
      ".v3-mega-shortcut",
      ".v3-off-panel",
      ".v3-cat-runway",
      ".v3-rail-head h2",
      ".v3-off--reconstructed",
    ]) {
      expect(componentsCss).toContain(keepGlobal);
    }
    // ...and those sibling-only selectors must NOT leak onto the ride chunk.
    expect(rideCss).not.toContain(".v3-mega-shortcut");
    expect(rideCss).not.toContain(".v3-off-panel");
    expect(rideCss).not.toContain(".v3-cat-runway");
    expect(rideCss).not.toContain(".v3-rail-head");
  });

  it("imports the colocated sheet from the component", () => {
    expect(rideSource).toContain("./race-control-panel.css");
  });

  it("defers the ride-cinema section via next/dynamic on the home page", () => {
    expect(homePageSource).toContain('import dynamic from "next/dynamic"');
    expect(homePageSource).toContain('./_components/home/race-control-panel"');
    expect(homePageSource).toContain("dynamic(");
  });
});
