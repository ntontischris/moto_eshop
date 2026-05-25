import { describe, it, expect } from "vitest";
import { isCampaignVisible, isCampaignExpired } from "./visibility";
import type { Campaign } from "./types";

const base: Campaign = {
  id: "c1",
  name: "x",
  slug: "x",
  status: "published",
  starts_at: null,
  expires_at: null,
  redirect_url: "/",
  serving_mode: "split",
  default_variant_id: null,
  noindex: true,
};

const now = new Date("2026-06-01T12:00:00Z");

describe("visibility", () => {
  it("published with no window is visible", () => {
    expect(isCampaignVisible(base, now)).toBe(true);
  });

  it("draft is never visible", () => {
    expect(isCampaignVisible({ ...base, status: "draft" }, now)).toBe(false);
  });

  it("not visible before starts_at", () => {
    const c = { ...base, starts_at: "2026-06-02T00:00:00Z" };
    expect(isCampaignVisible(c, now)).toBe(false);
  });

  it("expired when now is past expires_at", () => {
    const c = { ...base, expires_at: "2026-05-31T00:00:00Z" };
    expect(isCampaignExpired(c, now)).toBe(true);
    expect(isCampaignVisible(c, now)).toBe(false);
  });

  it("not expired when expires_at is in the future", () => {
    const c = { ...base, expires_at: "2026-12-31T00:00:00Z" };
    expect(isCampaignExpired(c, now)).toBe(false);
  });
});
