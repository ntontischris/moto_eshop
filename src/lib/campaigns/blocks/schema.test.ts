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

  it("applies the editorial default imagePosition", () => {
    const parsed = blockSchema.parse({
      type: "editorial",
      title: "T",
      body: "B",
      imageUrl: "x",
    });
    if (parsed.type === "editorial") {
      expect(parsed.imagePosition).toBe("left");
    }
  });

  it("rejects a comparison with fewer than 2 products", () => {
    expect(() =>
      blockSchema.parse({ type: "comparison", productIds: ["only-one"] }),
    ).toThrow();
  });

  it("parses faq, socialProof, brandStrip, stickyCta", () => {
    const blocks = [
      { type: "faq", items: [{ q: "Q?", a: "A." }] },
      { type: "socialProof", stats: [{ label: "Riders", value: "10k" }] },
      {
        type: "brandStrip",
        logos: [{ name: "AGV", imageUrl: "/agv.svg" }],
      },
      { type: "stickyCta", label: "Buy", href: "/lp/x" },
    ];
    expect(blocksSchema.parse(blocks)).toHaveLength(4);
  });

  it("applies emailCapture defaults", () => {
    const parsed = blockSchema.parse({ type: "emailCapture", title: "Join" });
    if (parsed.type === "emailCapture") {
      expect(parsed.buttonLabel).toBe("Εγγραφή");
      expect(parsed.source).toBe("campaign");
    }
  });

  it("parses a productRail with auto brand source", () => {
    const parsed = blockSchema.parse({
      type: "productRail",
      source: { mode: "auto", by: "brand", value: "alpinestars" },
    });
    expect(parsed).toMatchObject({ type: "productRail" });
  });
});
