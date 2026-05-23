import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const railSource = readFileSync(
  new URL("./product-rail.tsx", import.meta.url),
  "utf8",
);
const scrollerSource = readFileSync(
  new URL("./product-rail-scroller.tsx", import.meta.url),
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
      "const galleryProducts = products.slice(0, 16);",
    );
    expect(railSource).toContain("v3-rail--nour-gallery");
    expect(railSource).toContain("New arrivals");
    expect(railSource).toContain("ProductRailScroller");
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

  it("cycles a product's images only while it is hovered, and tilts in 3D", () => {
    expect(cardSource).toContain("gallery_image_urls");
    expect(cardSource).toContain("setInterval");
    expect(cardSource).toContain("CYCLE_MS = 1700");
    expect(cardSource).toContain("startCycle");
    expect(cardSource).toContain("stopCycle");
    expect(cardSource).toContain("onMouseEnter");
    expect(cardSource).toContain("onMouseLeave");
    // hover-driven, not auto-play across the whole rail
    expect(cardSource).not.toContain("IntersectionObserver");
    expect(cardSource).toContain("prefers-reduced-motion");
    expect(cardSource).toContain("perspective(900px)");
    expect(cardSource).toContain("rotateX");
    expect(cardSource).toContain("is-active");
    expect(componentsCss).toContain(".v3-gallery-shot.is-active");
    expect(componentsCss).toContain(".v3-gallery-dots");
    expect(componentsCss).toContain("border-radius: 20px");
    expect(componentsCss).toContain(".v3-gallery-card::after");
  });

  it("scrolls freely only while the mouse button is held", () => {
    expect(scrollerSource).toContain("v3-gallery-grid");
    expect(scrollerSource).toContain("ProductRailCard");
    expect(scrollerSource).toContain("onPointerDown");
    expect(scrollerSource).toContain('pointerType !== "mouse"');
    expect(scrollerSource).toContain("setPointerCapture");
    expect(scrollerSource).toContain("scrollLeft");
    // moving with no button held must NOT scroll
    expect(scrollerSource).toContain("down.current");
    // native image drag must not hijack the drag-scroll
    expect(scrollerSource).toContain("onDragStart");
    expect(scrollerSource).toContain("is-dragging");
    expect(componentsCss).toContain("overflow-x: auto");
    expect(componentsCss).toContain(".v3-gallery-grid.is-dragging");
  });
});
