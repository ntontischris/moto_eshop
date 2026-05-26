import { describe, it, expect } from "vitest";
import { TEMPLATES, getTemplate } from "./index";
import { blocksSchema } from "@/lib/campaigns/blocks/schema";

const SAMPLE_INPUTS: Record<string, Record<string, unknown>> = {
  sale: {
    heroHeadline: "-20% σε όλα τα κράνη",
    heroImage: "https://cdn/x.jpg",
    discountText: "Black Friday -20%",
    discountCode: "BF20",
    countdownTargetAt: "2026-11-28T00:00:00Z",
    productCategory: "krani",
  },
  "new-product": {
    heroHeadline: "AGV Pista — Έφτασε",
    heroImage: "https://cdn/x.jpg",
    storyTitle: "Σχεδιασμένο για το trackday",
    storyBody: "Lorem ipsum",
    storyImage: "https://cdn/y.jpg",
    productIds: ["id-1", "id-2", "id-3"],
  },
  brand: {
    heroHeadline: "AGV — Made in Italy",
    heroImage: "https://cdn/x.jpg",
    brandSlug: "agv",
    storyTitle: "Από το 1947",
    storyBody: "Lorem",
    storyImage: "https://cdn/y.jpg",
  },
  "riding-style": {
    heroHeadline: "Εξοπλισμός για σπορ",
    heroImage: "https://cdn/x.jpg",
    rideCategory: "krani-racing",
  },
  seasonal: {
    heroHeadline: "Έτοιμος για τον χειμώνα",
    heroImage: "https://cdn/x.jpg",
    productCategory: "xeimoniatika",
    discountText: "Χειμερινή προσφορά",
    discountCode: "WINTER10",
  },
  bundle: {
    heroHeadline: "Σετ νέου αναβάτη",
    heroImage: "https://cdn/x.jpg",
    productIds: ["a", "b", "c"],
    bundleDiscountText: "-15% στο σετ",
    bundleDiscountCode: "BUNDLE15",
  },
  lead: {
    heroHeadline: "Γίνε μέλος",
    heroImage: "https://cdn/x.jpg",
    leadTitle: "MotoMarket Insider",
    leadSubtitle: "Προσφορές & νέα στο inbox σου",
  },
  contest: {
    heroHeadline: "Κέρδισε ένα κράνος",
    heroImage: "https://cdn/x.jpg",
    endDate: "2026-12-31T00:00:00Z",
    prizeTitle: "Το δώρο",
    prizeDescription: "Κράνος AGV K6",
  },
};

describe("TEMPLATES", () => {
  it("has 8 templates with unique ids", () => {
    expect(TEMPLATES).toHaveLength(8);
    const idSet = new Set(TEMPLATES.map((t) => t.id));
    expect(idSet.size).toBe(8);
  });

  it.each(TEMPLATES.map((t) => [t.id] as const))(
    "%s: build(sample) produces blocks that pass blocksSchema",
    (id) => {
      const tpl = getTemplate(id);
      expect(tpl).not.toBeNull();
      const input = SAMPLE_INPUTS[id];
      expect(input).toBeDefined();
      const blocks = tpl!.build(input);
      expect(blocks.length).toBeGreaterThan(0);
      expect(() => blocksSchema.parse(blocks)).not.toThrow();
    },
  );

  it("templates with missing optional fields still produce valid blocks", () => {
    // Sale without countdown + category
    const minimalSale = TEMPLATES[0].build({
      heroHeadline: "x",
      heroImage: "https://cdn/x.jpg",
      discountText: "x",
      discountCode: "x",
    });
    expect(() => blocksSchema.parse(minimalSale)).not.toThrow();
  });

  it("templates skip blocks whose required source data is missing", () => {
    // riding-style without rideCategory → no productRail block
    const blocks = TEMPLATES[3].build({
      heroHeadline: "x",
      heroImage: "https://cdn/x.jpg",
    });
    expect(blocks.some((b) => b.type === "productRail")).toBe(false);
    expect(() => blocksSchema.parse(blocks)).not.toThrow();
  });
});
