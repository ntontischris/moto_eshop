import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const source = readFileSync(
  new URL("./bike-selector.tsx", import.meta.url),
  "utf8",
);

describe("bike selector chip logo", () => {
  it("only renders the logo image when a real logo exists", () => {
    expect(source).toContain("const hasLogo = BIKE_LOGOS.has(slug)");
    expect(source).toContain("{hasLogo && (");
  });

  it("never ships an empty src for the chip logo", () => {
    expect(source).not.toContain('src=""');
    expect(source).toContain("src={`/brands/bikes/${slug}.png`}");
  });

  it("gives the chip logo explicit dimensions to prevent CLS", () => {
    const logoBlock = source.slice(
      source.indexOf('className="v3-mb-chip-logo"'),
      source.indexOf('className="v3-mb-chip-logo"') + 240,
    );
    expect(logoBlock).toContain("width={24}");
    expect(logoBlock).toContain("height={16}");
  });
});
