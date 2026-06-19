import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const garageCss = readFileSync(
  new URL("./garage.css", import.meta.url),
  "utf8",
);
const garagePageSource = readFileSync(
  new URL("./page.tsx", import.meta.url),
  "utf8",
);
const bikeSelectorSource = readFileSync(
  new URL("../../../components/garage/bike-selector.tsx", import.meta.url),
  "utf8",
);
const garageCardSource = readFileSync(
  new URL("../../../components/garage/garage-card.tsx", import.meta.url),
  "utf8",
);
const compatBadgeSource = readFileSync(
  new URL(
    "../../../components/garage/compatibility-badge.tsx",
    import.meta.url,
  ),
  "utf8",
);

// Issue #121: /garage lives OUTSIDE the (store) group, so it must wire the v3
// tokens + .v3-root cascade root itself to render dark cinematic parity, and
// reserve an inert bike-list slot for S-4.1. These are source-contract
// assertions (presence/absence of markers), not styling assertions.
describe("garage page wires v3 tokens route-scoped and renders dark parity", () => {
  it("imports the colocated route-scoped sheet and the tokens", () => {
    expect(garagePageSource).toContain("./garage.css");
    expect(garagePageSource).toContain("../(store)/_styles/tokens.css");
  });

  it("establishes the .v3-root cascade root so --v3-* resolve and paint dark", () => {
    expect(garagePageSource).toContain("v3-root");
    expect(garagePageSource).toContain("data-v3");
  });

  it("does NOT mount V3Provider or import the home-critical components.css", () => {
    expect(garagePageSource).not.toContain("V3Provider");
    expect(garagePageSource).not.toContain("components.css");
  });

  it("reserves an inert bike-list slot marked for S-4.1", () => {
    expect(garagePageSource).toContain("data-garage-bike-slot");
    expect(garagePageSource).toContain("S-4.1");
    expect(garagePageSource).toContain('data-reserved-feature="S-4.1"');
  });

  it("drops light Tailwind semantic tokens from the page and primitives", () => {
    for (const source of [
      garagePageSource,
      bikeSelectorSource,
      garageCardSource,
      compatBadgeSource,
    ]) {
      expect(source).not.toContain("text-muted-foreground");
      expect(source).not.toContain("bg-background");
      expect(source).not.toContain("border-border");
      expect(source).not.toContain("text-destructive");
    }
    expect(compatBadgeSource).not.toContain("border-green-500");
    expect(compatBadgeSource).not.toContain("border-yellow-500");
  });

  it("styles primitives with .v3-garage-* classes", () => {
    expect(bikeSelectorSource).toContain("v3-garage-select");
    expect(garageCardSource).toContain("v3-garage-card");
    expect(compatBadgeSource).toContain("v3-compat");
  });
});

describe("garage.css is token-driven, route-scoped and motion-safe", () => {
  it("uses --v3-* custom properties, never light semantic tokens", () => {
    expect(garageCss).toContain("var(--v3-");
    expect(garageCss).not.toContain("var(--background)");
    expect(garageCss).not.toContain("var(--muted-foreground)");
  });

  it("defines the .v3-garage-* selectors", () => {
    for (const selector of [
      ".v3-garage",
      ".v3-garage-add",
      ".v3-garage-select",
      ".v3-garage-card",
      ".v3-garage-list",
      ".v3-garage-slot",
    ]) {
      expect(garageCss).toContain(selector);
    }
  });

  it("honors prefers-reduced-motion", () => {
    expect(garageCss).toContain("@media (prefers-reduced-motion: reduce)");
  });

  it("includes a mobile breakpoint", () => {
    expect(garageCss).toContain("@media (max-width: 768px)");
  });
});
