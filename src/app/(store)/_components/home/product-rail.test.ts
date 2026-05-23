import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const railSource = readFileSync(
  new URL("./product-rail.tsx", import.meta.url),
  "utf8",
);
const cardSource = readFileSync(
  new URL("./product-rail-card.tsx", import.meta.url),
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
    expect(railSource).toContain("galleryProducts.map");
    expect(railSource).toContain("ProductRailCard");
    expect(railSource).not.toContain("ProductRailCarousel");
    expect(railSource).not.toContain("v3-rail--garage-wall");
  });

  it("keeps product commerce data quiet but visible", () => {
    expect(cardSource).toContain("v3-gallery-plate");
    expect(cardSource).toContain("v3-gallery-info");
    expect(cardSource).toContain("AvailabilityBadge");
    expect(cardSource).toContain("PriceDisplay");
    expect(cardSource).toContain("v3-gallery-cta");
  });

  it("fills the image plate edge to edge instead of letterboxing it", () => {
    expect(componentsCss).toContain(
      "/* === nour inspired product gallery === */",
    );
    expect(componentsCss).toContain(".v3-rail--nour-gallery .v3-gallery-grid");
    expect(componentsCss).toContain(".v3-gallery-plate");
    expect(componentsCss).toContain("aspect-ratio: 3 / 4");
    expect(componentsCss).toContain(".v3-gallery-plate img");
    expect(componentsCss).toContain("object-fit: cover !important");
    expect(componentsCss).toContain("padding: 0 !important;");
  });

  it("auto-cycles every product image and tilts the card in 3D", () => {
    expect(cardSource).toContain("gallery_image_urls");
    expect(cardSource).toContain("useEffect");
    expect(cardSource).toContain("setInterval");
    expect(cardSource).toContain("CYCLE_MS = 1700");
    expect(cardSource).toContain("prefers-reduced-motion");
    expect(cardSource).toContain("perspective(900px)");
    expect(cardSource).toContain("rotateX");
    expect(cardSource).toContain("is-active");
    expect(componentsCss).toContain(".v3-gallery-shot.is-active");
    expect(componentsCss).toContain(".v3-gallery-dots");
    expect(componentsCss).toContain("border-radius: 18px");
  });
});
