import { describe, it, expect } from "vitest";
import { resolveVariant } from "./resolve-variant";
import type { CampaignWithVariants } from "./types";

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

describe("resolveVariant", () => {
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
