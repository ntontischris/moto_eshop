import { describe, it, expect } from "vitest";
import { decideCampaign } from "./decide";
import type { CampaignVariant, CampaignWithVariants } from "./types";
import type { SignalInput } from "./signals";

const variant = (id: string): CampaignVariant => ({
  id,
  campaign_id: "c1",
  name: id,
  blocks: [] as unknown as CampaignVariant["blocks"],
  weight: 1,
  targeting_rules: [],
  seo: {},
});

const campaign = (
  over: Partial<CampaignWithVariants> = {},
): CampaignWithVariants => ({
  id: "c1",
  name: "C",
  slug: "c",
  status: "published",
  starts_at: null,
  expires_at: null,
  redirect_url: "/offers",
  serving_mode: "split",
  default_variant_id: null,
  noindex: false,
  variants: [variant("a"), variant("b")],
  ...over,
});

const signalInput = (over: Partial<SignalInput> = {}): SignalInput => ({
  searchParams: {},
  userAgent: null,
  country: null,
  isReturning: false,
  bucket: 0,
  ...over,
});

const NOW = new Date("2026-06-01T00:00:00Z");

describe("decideCampaign", () => {
  it("redirects when expired, carrying the redirect url", () => {
    const d = decideCampaign(campaign({ expires_at: "2026-05-01T00:00:00Z" }), {
      now: NOW,
      signalInput: signalInput(),
    });
    expect(d).toEqual({ kind: "expired", redirectUrl: "/offers" });
  });

  it("hides an unpublished campaign", () => {
    const d = decideCampaign(campaign({ status: "draft" }), {
      now: NOW,
      signalInput: signalInput(),
    });
    expect(d.kind).toBe("hidden");
  });

  it("hides a campaign that has not started yet", () => {
    const d = decideCampaign(campaign({ starts_at: "2026-12-01T00:00:00Z" }), {
      now: NOW,
      signalInput: signalInput(),
    });
    expect(d.kind).toBe("hidden");
  });

  it("hides when there is no servable variant", () => {
    const d = decideCampaign(campaign({ variants: [] }), {
      now: NOW,
      signalInput: signalInput(),
    });
    expect(d.kind).toBe("hidden");
  });

  it("serves a variant with the extracted signals for a live campaign", () => {
    const d = decideCampaign(campaign(), {
      now: NOW,
      signalInput: signalInput({ userAgent: "iPhone", bucket: 0.1 }),
    });
    expect(d.kind).toBe("serve");
    if (d.kind === "serve") {
      expect(["a", "b"]).toContain(d.variant.id);
      expect(d.signals.device).toBe("mobile");
    }
  });
});
