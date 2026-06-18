import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const accountCss = readFileSync(
  new URL("./account.css", import.meta.url),
  "utf8",
);
const accountPageSource = readFileSync(
  new URL("./page.tsx", import.meta.url),
  "utf8",
);

// Cycle 1 (issue #122): polish the account page to cinematic parity and move
// the inline <AccStyles/> <style> block into a colocated route-scoped sheet.
// Dark stays the SSR base; light deltas are scoped under data-v3-mode="light"
// so there is no light-theme flash. Garage / wishlist / order-detail are
// reserved as INERT slots only — the underlying views stay out of scope.
describe("account page — cinematic parity, route-scoped css, inert slots", () => {
  it("colocates the account rules in account.css with v3 tokens", () => {
    for (const selector of [
      ".v3-acc",
      ".v3-acc-head",
      ".v3-acc-orders",
      ".v3-acc-order",
      ".v3-acc-empty",
      ".v3-acc-nav",
      ".v3-acc-signout",
    ]) {
      expect(accountCss).toContain(selector);
    }
    expect(accountCss).toContain("var(--v3-");
  });

  it("scopes light-mode deltas so dark is the SSR base (no flash)", () => {
    expect(accountCss).toContain('html[data-v3-mode="light"] .v3-acc');
  });

  it("honors prefers-reduced-motion", () => {
    expect(accountCss).toContain("prefers-reduced-motion: reduce");
  });

  it("loads account.css only from the /account page entry", () => {
    expect(accountPageSource).toContain("./account.css");
  });

  it("drops the old inline <AccStyles/> <style> block", () => {
    expect(accountPageSource).not.toContain("function AccStyles");
    expect(accountPageSource).not.toContain('precedence="default"');
  });

  it("reserves garage / wishlist / order-detail as marked slots", () => {
    for (const marker of [
      "RESERVED SLOT — garage view out of scope (#122)",
      "RESERVED SLOT — wishlist view out of scope (#122)",
      "RESERVED SLOT — order-detail view out of scope (#122)",
    ]) {
      expect(accountPageSource).toContain(marker);
    }
  });

  it("keeps the reserved slots inert — no links wired to missing routes", () => {
    expect(accountPageSource).toContain('data-reserved="true"');
    expect(accountPageSource).toContain('aria-disabled="true"');
    // no slot is wired to a (non-existent) garage/wishlist/order route
    expect(accountPageSource).not.toContain('href="/garage');
    expect(accountPageSource).not.toContain('href="/wishlist');
    expect(accountPageSource).not.toContain("/orders/");
  });
});
