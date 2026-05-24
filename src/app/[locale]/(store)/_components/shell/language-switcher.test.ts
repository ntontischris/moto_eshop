import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const src = readFileSync(
  new URL("./language-switcher.tsx", import.meta.url),
  "utf8",
);

describe("language-switcher", () => {
  it("uses next-intl navigation, not next/navigation", () => {
    expect(src).toContain('from "@/i18n/navigation"');
    expect(src).not.toContain('from "next/navigation"');
  });
  it("offers every routing locale", () => {
    expect(src).toContain("routing.locales");
  });
  it("switches locale while preserving the current path", () => {
    expect(src).toContain("router.replace(pathname, { locale:");
  });
});
