import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const componentsCss = readFileSync(
  new URL("../../_styles/components.css", import.meta.url),
  "utf8",
);
const editorialCss = readFileSync(
  new URL("./editorial-band.css", import.meta.url),
  "utf8",
);
const editorialSource = readFileSync(
  new URL("./editorial-band.tsx", import.meta.url),
  "utf8",
);
const homePageSource = readFileSync(
  new URL("../../page.tsx", import.meta.url),
  "utf8",
);

// S5d (issue #89, Lever 2): the editorial chapter sits ~6th on the homepage,
// well below the ~92vh hero, so its live `v3-ed*` chapter CSS is carved out of
// the render-blocking monolith into a sheet colocated with the component, and
// the section is loaded via next/dynamic so that sheet code-splits off the home
// critical path. The hero stays critically styled.
describe("editorial-band css is carved out of the home-critical sheet", () => {
  it("removes the live editorial chapter rules from the shared components.css", () => {
    // The rendered editorial section uses `.v3-ed`/`.v3-ed--chapter` and the
    // `.v3-edc-w*` word-reveal helpers — none of these may remain on the
    // render-blocking monolith.
    for (const marker of [
      "/* === editorial-band === */",
      ".v3-ed {",
      ".v3-ed--chapter",
      ".v3-ed-stage",
      ".v3-ed-bar",
      ".v3-ed-kicker",
      ".v3-ed-quote",
      ".v3-edc-w",
    ]) {
      expect(componentsCss).not.toContain(marker);
    }
  });

  it("leaves the dead, cross-section .v3-ed--reconstructed rules global", () => {
    // `.v3-ed--reconstructed` is an unused editorial variant (the component
    // renders `--chapter`), and its base rule is fused in a comma-group shared
    // with the LIVE `.v3-mb/--bc/--trust--reconstructed` sections. Per the
    // established `--reconstructed`-stays-global precedent (product-rail /
    // race-control css tests), it is left untouched in the monolith.
    expect(componentsCss).toContain(".v3-ed--reconstructed");
  });

  it("colocates the live base + chapter + word-reveal rules in editorial-band.css", () => {
    for (const selector of [
      ".v3-ed {",
      ".v3-ed-media {",
      ".v3-ed-scrim {",
      ".v3-ed-inner {",
      ".v3-ed-kicker {",
      ".v3-ed-bar {",
      ".v3-ed-title {",
      ".v3-ed-text {",
      ".v3-ed--chapter {",
      ".v3-ed--chapter .v3-ed-stage {",
      ".v3-ed--chapter .v3-ed-quote {",
      ".v3-ed--chapter .v3-ed-cta {",
      ".v3-edc-w {",
      ".v3-edc-w-in {",
    ]) {
      expect(editorialCss).toContain(selector);
    }
  });

  it("colocates the responsive + reduced-motion editorial rules", () => {
    for (const fragment of [
      "@media (max-width: 720px)",
      "@media (prefers-reduced-motion: reduce)",
    ]) {
      expect(editorialCss).toContain(fragment);
    }
  });

  it("imports the colocated sheet from the component", () => {
    expect(editorialSource).toContain("./editorial-band.css");
  });

  it("defers the editorial section via next/dynamic on the home page", () => {
    expect(homePageSource).toContain('import dynamic from "next/dynamic"');
    expect(homePageSource).toContain('./_components/home/editorial-band"');
    expect(homePageSource).toContain("dynamic(");
  });
});
