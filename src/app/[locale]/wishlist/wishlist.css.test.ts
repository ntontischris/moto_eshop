import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const wishlistCss = readFileSync(
  new URL("./wishlist.css", import.meta.url),
  "utf8",
);
const pageSource = readFileSync(new URL("./page.tsx", import.meta.url), "utf8");
const componentsCss = readFileSync(
  new URL("../(store)/_styles/components.css", import.meta.url),
  "utf8",
);

// Issue #120: bring /wishlist to full cinematic dark parity. The route lives
// OUTSIDE the (store) group, so it must pull the shared --v3-* tokens + the
// dark .v3-root shell itself, then carry its own page rules in a colocated
// sheet that never touches the home critical path.
describe("wishlist is cinematic dark, route-scoped off the home critical path", () => {
  it("wires the shared tokens, primitives and the colocated sheet from the page", () => {
    expect(pageSource).toContain('"../(store)/_styles/tokens.css"');
    expect(pageSource).toContain('"../(store)/_styles/components.css"');
    expect(pageSource).toContain('"./wishlist.css"');
  });

  it("renders inside the dark .v3-root shell so dark paints on first SSR byte", () => {
    expect(pageSource).toContain('className="v3-root" data-v3');
  });

  it("uses v3 markup and the shared display/label/button primitives", () => {
    for (const marker of [
      "v3-wishlist",
      "v3-wishlist-grid",
      "v3-wishlist-card",
      "v3-wishlist-toggle",
      "v3-wishlist-empty",
      "v3-display",
      "v3-label",
      "v3-btn-primary",
    ]) {
      expect(pageSource).toContain(marker);
    }
  });

  it("no longer references the light Tailwind semantic tokens it previously used", () => {
    for (const lightToken of [
      "bg-card",
      "text-muted-foreground",
      "bg-white",
      "text-gray-900",
      "bg-muted",
      "hover:shadow-md",
    ]) {
      expect(pageSource).not.toContain(lightToken);
    }
  });

  it("colocates the wishlist page selectors in wishlist.css", () => {
    for (const selector of [
      ".v3-wishlist--apple",
      ".v3-wishlist-title",
      ".v3-wishlist-grid",
      ".v3-wishlist-card",
      ".v3-wishlist-media",
      ".v3-wishlist-oos",
      ".v3-wishlist-toggle",
      ".v3-wishlist-empty",
      ".v3-wishlist-skeleton-card",
    ]) {
      expect(wishlistCss).toContain(selector);
    }
  });

  it("drives every colour off --v3-* tokens, not hardcoded light values", () => {
    expect(wishlistCss).toContain("var(--v3-bone)");
    expect(wishlistCss).toContain("var(--v3-surface)");
    expect(wishlistCss).toContain("var(--v3-line)");
    expect(wishlistCss).toContain("var(--v3-red-bright)");
  });

  it("preserves the light-mode override and honours reduced motion", () => {
    expect(wishlistCss).toContain(
      'html[data-v3-mode="light"] .v3-wishlist-card',
    );
    expect(wishlistCss).toContain("@media (prefers-reduced-motion: reduce)");
  });

  it("keeps the wishlist rules OFF the home-critical components.css (containment)", () => {
    expect(componentsCss).not.toContain(".v3-wishlist");
  });
});
