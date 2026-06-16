import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const componentsCss = readFileSync(
  new URL("../../_styles/components.css", import.meta.url),
  "utf8",
);
const productCardSource = readFileSync(
  new URL("./product-card.tsx", import.meta.url),
  "utf8",
);

// Issue #71 (ADR 0007): the legacy `.v3-card` BEM block was superseded by
// `.v3-product-card` / `.v3-gallery-*`. Only three orphan element classes are
// still rendered, so the dead structural rules were dropped from the
// render-blocking monolith. These guards fail if a refactor either resurrects
// a dead `.v3-card*` rule on the critical sheet or stops rendering one of the
// three classes the monolith still legitimately styles.
describe("legacy v3-card rules stay dead and out of the critical sheet", () => {
  it("removes the dead v3-card structural rules from components.css", () => {
    for (const deadSelector of [
      ".v3-card ", // block root + descendant forms
      ".v3-card{",
      ".v3-card:",
      ".v3-card::",
      ".v3-card__body",
      ".v3-card__footer",
      ".v3-card__img-wrap",
      ".v3-card__name",
      ".v3-card__rank",
      ".v3-card__scan",
      ".v3-card__telemetry",
    ]) {
      expect(componentsCss).not.toContain(deadSelector);
    }
  });

  it("keeps the three v3-card classes the product card still renders", () => {
    for (const liveSelector of [
      ".v3-card__brand",
      ".v3-card__badges",
      ".v3-card__cta",
    ]) {
      expect(componentsCss).toContain(liveSelector);
    }
    expect(productCardSource).toContain('"v3-card__brand"');
    expect(productCardSource).toContain('"v3-card__badges"');
    expect(productCardSource).toContain('"v3-card__cta"');
  });
});
