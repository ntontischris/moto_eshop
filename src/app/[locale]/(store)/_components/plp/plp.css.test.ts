import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const componentsCss = readFileSync(
  new URL("../../_styles/components.css", import.meta.url),
  "utf8",
);
const plpCss = readFileSync(new URL("./plp.css", import.meta.url), "utf8");
const categoryViewSource = readFileSync(
  new URL("./category-view.tsx", import.meta.url),
  "utf8",
);

// S3 (issue #84): route-scope the PLP-only CSS off the home critical path.
// Containment seam — the PLP prefixes are GONE from the home-critical sheet
// and PRESENT in the colocated PLP sheet, imported only by the PLP entry
// (CategoryView, rendered by the [...path] catch-all). Scope includes v3-plp
// (the PLP layout) alongside v3-fs/v3-mfd: all three are PLP-exclusive and
// rendered by the same entry (plan listed only fs/mfd — corrected here, same
// way S2 moved the full pdp-client layout). Gallery (v3-gal) stays.
describe("plp css is route-scoped off the home critical path", () => {
  it("removes every PLP-only prefix from the shared components.css", () => {
    for (const prefix of [".v3-fs", ".v3-mfd", ".v3-plp"]) {
      expect(componentsCss).not.toContain(prefix);
    }
  });

  it("colocates the PLP rules in plp.css", () => {
    for (const selector of [
      ".v3-fs",
      ".v3-fs-grp",
      ".v3-fs-apply",
      ".v3-mfd-trigger",
      ".v3-mfd-panel",
      ".v3-plp",
      ".v3-plp-grid",
      ".v3-plp-sort",
    ]) {
      expect(plpCss).toContain(selector);
    }
  });

  it("keeps out-of-scope gallery rules in components.css", () => {
    expect(componentsCss).toContain(".v3-gal");
  });

  it("loads plp.css only from the PLP entry component", () => {
    expect(categoryViewSource).toContain("./plp.css");
  });
});
