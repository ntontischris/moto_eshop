import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  LQIP_DATA_URI_PREFIX,
  LQIP_MAX_DATA_URI_LENGTH,
  LQIP_SOURCES,
  getLqip,
  isLqipEntry,
  lqipBackground,
} from "./lqip";
import manifest from "./lqip-manifest.json";

const entries = manifest as Record<string, unknown>;

const VALID_ENTRY = {
  dataUri: `${LQIP_DATA_URI_PREFIX}UklGRiQAAABXRUJQVlA4IBgAAAAwAQCdASoB`,
  width: 1920,
  height: 1080,
};

describe("lqip generator output contract", () => {
  it("covers every curated home source", () => {
    for (const src of LQIP_SOURCES) {
      expect(entries[src], `missing manifest entry for ${src}`).toBeDefined();
    }
  });

  it("produces only contract-valid entries", () => {
    expect(Object.keys(entries).length).toBeGreaterThan(0);
    for (const [src, entry] of Object.entries(entries)) {
      expect(isLqipEntry(entry), `invalid entry for ${src}`).toBe(true);
    }
  });

  it("keeps the total inlined payload small (Lighthouse budget)", () => {
    const total = Object.values(entries).reduce(
      (sum: number, entry) =>
        sum + (isLqipEntry(entry) ? entry.dataUri.length : 0),
      0,
    );
    expect(total).toBeLessThan(24_000);
  });

  it("covers the curated asset paths referenced by the home components", () => {
    const componentsDir = new URL("../_components/home/", import.meta.url);
    const files = [
      "hero.tsx",
      "race-control-panel.tsx",
      "category-shortcut-grid.tsx",
      "my-bike-entry.tsx",
    ];
    const pathRe =
      /\/(?:hero-variants|ride-selector|category-atelier|mega-menu)\/[\w.-]+\.webp/g;
    for (const file of files) {
      const source = readFileSync(new URL(file, componentsDir), "utf8");
      for (const assetPath of source.match(pathRe) ?? []) {
        expect(
          entries[assetPath],
          `${file} renders ${assetPath} without an LQIP entry`,
        ).toBeDefined();
      }
    }
  });
});

describe("isLqipEntry", () => {
  it("accepts a contract-valid entry", () => {
    expect(isLqipEntry(VALID_ENTRY)).toBe(true);
  });

  it("rejects a wrong data URI prefix", () => {
    expect(
      isLqipEntry({ ...VALID_ENTRY, dataUri: "data:image/png;base64,AAAA" }),
    ).toBe(false);
  });

  it("rejects a non-base64 payload", () => {
    expect(
      isLqipEntry({
        ...VALID_ENTRY,
        dataUri: `${LQIP_DATA_URI_PREFIX}not base64!!`,
      }),
    ).toBe(false);
  });

  it("rejects an oversized placeholder", () => {
    expect(
      isLqipEntry({
        ...VALID_ENTRY,
        dataUri: `${LQIP_DATA_URI_PREFIX}${"A".repeat(LQIP_MAX_DATA_URI_LENGTH)}`,
      }),
    ).toBe(false);
  });

  it("rejects missing or non-positive dimensions", () => {
    expect(isLqipEntry({ ...VALID_ENTRY, width: 0 })).toBe(false);
    expect(isLqipEntry({ ...VALID_ENTRY, height: -1 })).toBe(false);
    expect(isLqipEntry({ dataUri: VALID_ENTRY.dataUri })).toBe(false);
    expect(isLqipEntry(null)).toBe(false);
    expect(isLqipEntry("string")).toBe(false);
  });
});

describe("getLqip / lqipBackground", () => {
  it("returns the entry for a known curated source", () => {
    const entry = getLqip("/hero-variants/motomarket-race-control-hero.webp");
    expect(entry).toBeDefined();
    expect(entry?.dataUri.startsWith(LQIP_DATA_URI_PREFIX)).toBe(true);
  });

  it("returns undefined for an unknown source", () => {
    expect(getLqip("/not/in/the/manifest.webp")).toBeUndefined();
  });

  it("stacks the placeholder over the gradient fallback", () => {
    const background = lqipBackground(
      "/hero-variants/motomarket-race-control-hero.webp",
    );
    expect(background.startsWith(`url("${LQIP_DATA_URI_PREFIX}`)).toBe(true);
    expect(background.endsWith("var(--v3-lqip-fallback)")).toBe(true);
  });

  it("falls back to the gradient alone for unknown sources", () => {
    expect(lqipBackground("/not/in/the/manifest.webp")).toBe(
      "var(--v3-lqip-fallback)",
    );
  });
});
