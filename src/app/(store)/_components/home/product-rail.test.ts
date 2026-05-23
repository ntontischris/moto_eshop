import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const railSource = readFileSync(
  new URL("./product-rail.tsx", import.meta.url),
  "utf8",
);
const componentsCss = readFileSync(
  new URL("../../_styles/components.css", import.meta.url),
  "utf8",
);

describe("product rail", () => {
  it("renders a Nour-inspired lightweight product gallery", () => {
    expect(railSource).toContain(
      "const galleryProducts = products.slice(0, 5);",
    );
    expect(railSource).toContain("v3-rail--nour-gallery");
    expect(railSource).toContain("v3-gallery-grid");
    expect(railSource).toContain("New arrivals");
    expect(railSource).not.toContain("ProductRailCarousel");
    expect(railSource).not.toContain("v3-rail--garage-wall");
  });

  it("keeps product commerce data quiet but visible", () => {
    expect(railSource).toContain("galleryProducts.map");
    expect(railSource).toContain("v3-gallery-plate");
    expect(railSource).toContain("v3-gallery-info");
    expect(railSource).toContain("AvailabilityBadge");
    expect(railSource).toContain("PriceDisplay");
    expect(railSource).toContain("v3-gallery-cta");
  });

  it("styles the gallery with calm image plates and no destructive image effects", () => {
    expect(componentsCss).toContain(
      "/* === nour inspired product gallery === */",
    );
    expect(componentsCss).toContain(".v3-rail--nour-gallery .v3-gallery-grid");
    expect(componentsCss).toContain(".v3-gallery-plate");
    expect(componentsCss).toContain("aspect-ratio: 3 / 4");
    expect(componentsCss).toContain(".v3-gallery-plate img");
    expect(componentsCss).toContain("object-fit: contain !important");
    expect(componentsCss).not.toContain(
      ".v3-rail--nour-gallery .v3-gallery-plate img {\n  mix-blend-mode",
    );
  });

  it("swaps to a second product image on hover when one exists", () => {
    expect(railSource).toContain("p.secondary_image_url");
    expect(railSource).toContain('className="v3-gallery-shot is-primary"');
    expect(railSource).toContain('className="v3-gallery-shot is-alt"');
    expect(componentsCss).toContain(
      "/* === product card hover image swap (Nour-inspired) === */",
    );
    expect(componentsCss).toContain(".v3-gallery-shot.is-alt");
    expect(componentsCss).toContain(
      ".v3-gallery-card:hover .v3-gallery-shot.is-alt",
    );
  });
});
