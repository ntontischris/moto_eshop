import { describe, it, expect } from "vitest";
import { extractSignals } from "./signals";

describe("extractSignals", () => {
  it("reads utm_source and collects utm_* params", () => {
    const s = extractSignals({
      searchParams: { utm_source: "instagram", utm_campaign: "bf", foo: "bar" },
      userAgent: null,
      country: "GR",
      isReturning: false,
      bucket: 0.5,
    });
    expect(s.source).toBe("instagram");
    expect(s.utm).toEqual({ utm_source: "instagram", utm_campaign: "bf" });
    expect(s.country).toBe("GR");
  });

  it("detects mobile from the user agent", () => {
    const s = extractSignals({
      searchParams: {},
      userAgent: "Mozilla/5.0 (iPhone)",
      country: null,
      isReturning: true,
      bucket: 0,
    });
    expect(s.device).toBe("mobile");
  });

  it("defaults to desktop", () => {
    const s = extractSignals({
      searchParams: {},
      userAgent: "Mozilla/5.0 (Windows NT 10.0)",
      country: null,
      isReturning: false,
      bucket: 0,
    });
    expect(s.device).toBe("desktop");
  });

  it("falls back to ?source when no utm_source", () => {
    const s = extractSignals({
      searchParams: { source: "newsletter" },
      userAgent: null,
      country: null,
      isReturning: false,
      bucket: 0,
    });
    expect(s.source).toBe("newsletter");
  });
});
