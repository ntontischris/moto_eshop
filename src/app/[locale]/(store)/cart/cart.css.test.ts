import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const componentsCss = readFileSync(
  new URL("../_styles/components.css", import.meta.url),
  "utf8",
);
const cartCss = readFileSync(new URL("./cart.css", import.meta.url), "utf8");
const cartPageSource = readFileSync(
  new URL("./page.tsx", import.meta.url),
  "utf8",
);

// S4 (issue #85): split the mixed v3-cart CSS. The global slide-over drawer
// (v3-cart-panel-*, rendered by the shell on every route) stays in the shared
// home-critical sheet. The dedicated /cart page styles move to a colocated
// sheet imported only by the /cart segment. Fused selector groups (e.g.
// rec-card + page-rec, panel + sum) are split: the panel/global half stays,
// the page half is duplicated into cart.css.
describe("cart css is split — drawer stays global, /cart page is route-scoped", () => {
  it("removes every /cart-page-only prefix from the shared components.css", () => {
    for (const prefix of [
      ".v3-cart--apple",
      ".v3-cart-bc",
      ".v3-cart-title",
      ".v3-cart-grid",
      ".v3-cart-row",
      ".v3-cart-side",
      ".v3-cart-sum",
      ".v3-cart-qty",
      ".v3-cart-price",
      ".v3-cart-page-rec",
      ".v3-cart-checkout",
      ".v3-cart-empty",
    ]) {
      expect(componentsCss).not.toContain(prefix);
    }
  });

  it("colocates the /cart page rules in cart.css", () => {
    for (const selector of [
      ".v3-cart--apple",
      ".v3-cart-grid",
      ".v3-cart-row",
      ".v3-cart-side",
      ".v3-cart-sum",
      ".v3-cart-sum-total",
      ".v3-cart-title",
      ".v3-cart-qty",
      ".v3-cart-page-rec",
      ".v3-cart-checkout",
    ]) {
      expect(cartCss).toContain(selector);
    }
  });

  it("keeps the global drawer + header cart rules in components.css", () => {
    for (const keep of [
      ".v3-cart-panel",
      ".v3-cart-rec-card",
      ".v3-cart-btn",
      ".v3-cart-badge",
      ".v3-cart-ghost",
    ]) {
      expect(componentsCss).toContain(keep);
    }
  });

  it("loads cart.css only from the /cart page entry", () => {
    expect(cartPageSource).toContain("./cart.css");
  });
});
