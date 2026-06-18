import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

// Cycle 1 (issue #125): each shared primitive gains a cinematic dark variant,
// single-sourced and additive. The CVA primitives (button / badge) carry it as
// a `cinematic` variant value; the non-CVA primitives (card / input / dialog /
// sheet) are styled via `[data-v3-cinematic]` + data-slot rules in
// primitives.css. These source-assertions guard the contract markers — NOT
// styling — mirroring pdp.css.test.ts and product-card.css.test.ts.

const read = (relative: string) =>
  readFileSync(new URL(relative, import.meta.url), "utf8");

const buttonSource = read("./button.tsx");
const badgeSource = read("./badge.tsx");
const cardSource = read("./card.tsx");
const inputSource = read("./input.tsx");
const dialogSource = read("./dialog.tsx");
const sheetSource = read("./sheet.tsx");
const primitivesCss = read("./primitives.css");

describe("cinematic dark variant exists for each shared primitive", () => {
  it("adds a cinematic CVA variant to button and badge", () => {
    expect(buttonSource).toContain("cinematic:");
    expect(buttonSource).toContain("var(--v3-red)");
    expect(badgeSource).toContain("cinematic:");
    expect(badgeSource).toContain("var(--v3-surface)");
  });

  it("keeps the existing light-mode defaults untouched (additive only)", () => {
    expect(buttonSource).toContain(
      'default: "bg-primary text-primary-foreground',
    );
    expect(buttonSource).toContain('variant: "default"');
    expect(badgeSource).toContain(
      'default: "bg-primary text-primary-foreground',
    );
    expect(badgeSource).toContain('variant: "default"');
  });

  it("self-hosts the dark token VALUES on the cinematic marker", () => {
    expect(primitivesCss).toContain("[data-v3-cinematic] {");
    expect(primitivesCss).toContain("--v3-surface: #17191e");
    expect(primitivesCss).toContain("--v3-bone: #f5f3ee");
    expect(primitivesCss).toContain("--v3-line: #2a2d35");
  });

  it("scopes a cinematic rule for each non-CVA primitive slot", () => {
    for (const slot of ["card", "input", "dialog-content", "sheet-content"]) {
      expect(primitivesCss).toContain(
        `[data-v3-cinematic] [data-slot="${slot}"]`,
      );
    }
  });

  it("drives the cinematic primitives with --v3-* tokens", () => {
    expect(primitivesCss).toContain("var(--v3-surface)");
    expect(primitivesCss).toContain("var(--v3-bone)");
    expect(primitivesCss).toContain("var(--v3-line)");
  });

  it("keeps dialog and sheet slots distinct so rules do not bleed", () => {
    expect(primitivesCss).toContain('[data-slot="dialog-content"]');
    expect(primitivesCss).toContain('[data-slot="sheet-content"]');
    expect(primitivesCss).not.toContain(
      '[data-slot="sheet-content"], [data-v3-cinematic] [data-slot="dialog-content"]',
    );
  });

  it("respects prefers-reduced-motion", () => {
    expect(primitivesCss).toContain("prefers-reduced-motion: reduce");
  });

  it("loads primitives.css only from the non-CVA primitive entries", () => {
    for (const source of [cardSource, inputSource, dialogSource, sheetSource]) {
      expect(source).toContain("./primitives.css");
    }
  });
});
