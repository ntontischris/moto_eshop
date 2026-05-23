import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { HERO_POSTER, HERO_POSTER_MOBILE } from "../../_lib/assets";

const heroSource = readFileSync(new URL("./hero.tsx", import.meta.url), "utf8");
const componentsCss = readFileSync(
  new URL("../../_styles/components.css", import.meta.url),
  "utf8",
);

describe("home hero", () => {
  it("uses the race-control image pair for desktop and mobile", () => {
    expect(HERO_POSTER).toBe("/hero-variants/motomarket-race-control-hero.webp");
    expect(HERO_POSTER_MOBILE).toBe(
      "/hero-variants/motomarket-race-control-mobile.webp",
    );
  });

  it("exposes the race-control gear room shopping paths", () => {
    expect(heroSource).toContain("v3-hero-gear-room");
    expect(heroSource).toContain("Bike Finder");
    expect(heroSource).toContain("v3-hero-mobile-break");
    expect(heroSource).toContain("Shop by ride");
    expect(heroSource).toContain("My Bike");
    expect(heroSource).toContain("Κράνη");
    expect(heroSource).toContain("Μπουφάν");
    expect(heroSource).toContain("Βαλίτσες");
    expect(heroSource).toContain("Λιπαντικά");
  });

  it("keeps the homepage sections visible soon after the hero", () => {
    expect(componentsCss).toContain(
      "min-height: min(560px, calc(100svh - 260px));",
    );
    expect(componentsCss).toContain(
      "min-height: min(520px, calc(100svh - 140px));",
    );
  });

  it("removes the hero guide overlay and restores the light-mode hero layer", () => {
    expect(componentsCss).toContain(
      ".v3-hero--ride-commerce::before,\n.v3-hero--ride-commerce::after {\n  display: none;",
    );
    expect(componentsCss).toContain("/* === final v3 light mode restore === */");
    expect(componentsCss).toContain(
      "html[data-v3-mode=\"light\"] .v3-hero--ride-commerce .v3-hero-scrim",
    );
    expect(componentsCss).toContain("rgba(246,244,239,.95)");
    expect(componentsCss).toContain(
      "html[data-v3-mode=\"light\"] .v3-hero-gear-tile",
    );
  });
});
