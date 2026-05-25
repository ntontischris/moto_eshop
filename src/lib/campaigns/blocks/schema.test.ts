import { describe, it, expect } from "vitest";
import { blockSchema, blocksSchema } from "./schema";

describe("blockSchema", () => {
  it("parses a valid hero block", () => {
    const hero = {
      type: "hero",
      headline: "Black Friday AGV",
      mediaUrl: "https://cdn/x.jpg",
      mediaType: "image",
      primaryCta: { label: "Shop", href: "/lp/agv" },
    };
    expect(blockSchema.parse(hero)).toMatchObject({ type: "hero" });
  });

  it("rejects an unknown block type", () => {
    expect(() => blockSchema.parse({ type: "nope" })).toThrow();
  });

  it("rejects a hero missing its headline", () => {
    expect(() =>
      blockSchema.parse({
        type: "hero",
        mediaUrl: "x",
        mediaType: "image",
        primaryCta: { label: "a", href: "/b" },
      }),
    ).toThrow();
  });

  it("parses a manual productRail", () => {
    const rail = {
      type: "productRail",
      source: { mode: "manual", productIds: ["id-1", "id-2"] },
    };
    expect(blockSchema.parse(rail)).toMatchObject({ type: "productRail" });
  });

  it("applies the auto productRail default limit", () => {
    const rail = {
      type: "productRail",
      source: { mode: "auto", by: "category", value: "krani" },
    };
    const parsed = blockSchema.parse(rail);
    expect(parsed).toMatchObject({ type: "productRail" });
    if (parsed.type === "productRail" && parsed.source.mode === "auto") {
      expect(parsed.source.limit).toBe(8);
    }
  });

  it("parses an array of blocks", () => {
    const blocks = [
      { type: "richText", html: "<p>hi</p>" },
      { type: "countdown", targetAt: "2026-11-28T00:00:00Z" },
    ];
    expect(blocksSchema.parse(blocks)).toHaveLength(2);
  });
});
