import { describe, it, expect } from "vitest";
import { resolveVariant } from "./resolve-variant";
import type { CampaignWithVariants } from "./types";
import type { Signals } from "./signals";

function make(defaultId: string | null): CampaignWithVariants {
  return {
    id: "c1",
    name: "x",
    slug: "x",
    status: "published",
    starts_at: null,
    expires_at: null,
    redirect_url: "/",
    serving_mode: "split",
    default_variant_id: defaultId,
    noindex: true,
    variants: [
      {
        id: "v1",
        campaign_id: "c1",
        name: "A",
        blocks: [],
        weight: 1,
        targeting_rules: [],
        seo: {},
      },
      {
        id: "v2",
        campaign_id: "c1",
        name: "B",
        blocks: [],
        weight: 1,
        targeting_rules: [],
        seo: {},
      },
    ],
  };
}

const sig = (over: Partial<Signals> = {}): Signals => ({
  source: null,
  utm: {},
  device: "desktop",
  country: null,
  isReturning: false,
  bucket: 0.25,
  ...over,
});

describe("resolveVariant (no signals)", () => {
  it("returns the default variant when set", () => {
    expect(resolveVariant(make("v2"))?.id).toBe("v2");
  });

  it("falls back to the first variant when no default", () => {
    expect(resolveVariant(make(null))?.id).toBe("v1");
  });

  it("returns null when there are no variants", () => {
    const c = { ...make(null), variants: [] };
    expect(resolveVariant(c)).toBeNull();
  });
});

describe("resolveVariant (with signals)", () => {
  it("targeting: returns the variant whose rules match", () => {
    const c = make(null);
    c.serving_mode = "targeting";
    c.variants[0].targeting_rules = [
      { field: "source", op: "eq", value: "google" },
    ];
    c.variants[1].targeting_rules = [
      { field: "source", op: "eq", value: "instagram" },
    ];
    expect(resolveVariant(c, sig({ source: "instagram" }))?.id).toBe("v2");
  });

  it("split: the bucket selects deterministically by weight", () => {
    const c = make(null);
    c.serving_mode = "split";
    expect(resolveVariant(c, sig({ bucket: 0.25 }))?.id).toBe("v1");
    expect(resolveVariant(c, sig({ bucket: 0.75 }))?.id).toBe("v2");
  });

  it("targeting with no match falls back to default", () => {
    const c = make("v2");
    c.serving_mode = "targeting";
    c.variants[0].targeting_rules = [
      { field: "source", op: "eq", value: "google" },
    ];
    expect(resolveVariant(c, sig({ source: "tiktok" }))?.id).toBe("v2");
  });
});
