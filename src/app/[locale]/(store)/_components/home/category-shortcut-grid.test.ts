import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const gridSource = readFileSync(
  new URL("./category-shortcut-grid.tsx", import.meta.url),
  "utf8",
);
const componentsCss = readFileSync(
  new URL("../../_styles/components.css", import.meta.url),
  "utf8",
);

describe("category shortcut grid", () => {
  it("renders as an editorial category atelier instead of a tab console", () => {
    expect(gridSource).toContain("v3-cat-atelier");
    expect(gridSource).toContain("v3-cat-spotlight");
    expect(gridSource).toContain("v3-cat-wall");
    expect(gridSource).toContain("v3-cat-tile");
    expect(gridSource).not.toContain("v3-cat-console");
  });

  it("uses the cohesive category atelier image set", () => {
    expect(gridSource).toContain("/category-atelier/helmets.webp");
    expect(gridSource).toContain("/category-atelier/jackets.webp");
    expect(gridSource).toContain("/category-atelier/gloves.webp");
    expect(gridSource).toContain("/category-atelier/boots.webp");
    expect(gridSource).toContain("/category-atelier/luggage.webp");
    expect(gridSource).toContain("/category-atelier/service.webp");
    expect(gridSource).toContain("/category-atelier/phone-mount.webp");
    expect(gridSource).toContain("/category-atelier/off-road.webp");
  });

  it("uses direct category links without duplicating the ride selector behavior", () => {
    expect(gridSource).not.toContain("setInterval");
    expect(gridSource).not.toContain("useState");
    expect(gridSource).not.toContain("data-auto-paused");
    expect(gridSource).toContain("const [spotlight, ...wallItems] = items;");
  });

  it("uses a distinct premium parts wall styling", () => {
    expect(componentsCss).toContain("/* === premium category atelier wall === */");
    expect(componentsCss).toContain(".v3-cat-spotlight");
    expect(componentsCss).toContain(".v3-cat-wall");
    expect(componentsCss).toContain(".v3-cat-tile--wide");
  });

  it("has a dedicated mobile stack instead of shrinking the desktop mosaic", () => {
    expect(componentsCss).toContain("/* === mobile category atelier stack === */");
    expect(componentsCss).toContain("grid-template-columns: repeat(2, minmax(0, 1fr));");
    expect(componentsCss).toContain(".v3-cat-wall .v3-cat-tile:nth-child(n + 5)");
    expect(componentsCss).toContain("grid-column: 1 / -1;");
  });

  it("lifts category cards with a backlight glow on hover", () => {
    expect(componentsCss).toContain("/* === category card hover lift glow === */");
    expect(componentsCss).toContain("transform: translateY(-6px) scale(1.015);");
    expect(componentsCss).toContain("0 0 42px rgba(228,17,31,.34)");
    expect(componentsCss).toContain(".v3-cat-spotlight:hover,");
    expect(componentsCss).toContain(".v3-cat-tile:hover {");
  });
});
