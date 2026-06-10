import { describe, it, expect } from "vitest";
import {
  sortByPosition,
  primaryImage,
  secondaryImage,
  galleryUrls,
  resolveImages,
  primaryImageUrl,
} from "./product-images";

const LEGACY = "https://www.motomarket-shop.gr/media/p/123-1.jpg";
const LEGACY_BARE = "https://motomarket-shop.gr/media/p/123-2.jpg";
const CDN =
  "https://abc.supabase.co/storage/v1/object/public/product-images/aa.webp";

const img = (position: number, url = `u${position}`) => ({
  url,
  alt: `a${position}`,
  position,
});

describe("product image shaping", () => {
  it("orders by position without mutating the input", () => {
    const input = [img(2), img(0), img(1)];
    const sorted = sortByPosition(input);
    expect(sorted.map((i) => i.position)).toEqual([0, 1, 2]);
    expect(input.map((i) => i.position)).toEqual([2, 0, 1]);
  });

  it("picks the lowest-position image as primary", () => {
    expect(primaryImage([img(3), img(1), img(2)])?.position).toBe(1);
    expect(primaryImage([])).toBeNull();
  });

  it("returns the second-by-position image, or null for a single shot", () => {
    expect(secondaryImage([img(5), img(1)])?.position).toBe(5);
    expect(secondaryImage([img(1)])).toBeNull();
    expect(secondaryImage([])).toBeNull();
  });

  it("caps gallery urls and drops empties", () => {
    const many = [img(0), img(1), img(2), img(3), img(4), img(5), img(6)];
    expect(galleryUrls(many)).toHaveLength(6);
    expect(galleryUrls(many, 2)).toEqual(["u0", "u1"]);
    expect(galleryUrls([img(1, ""), img(0)])).toEqual(["u0"]);
  });
});

describe("resolveImages — CDN preference", () => {
  it("prefers images_cdn wholesale when present, ignoring legacy images", () => {
    const out = resolveImages([LEGACY], [CDN], "Helmet");
    expect(out.map((i) => i.url)).toEqual([CDN]);
  });

  it("does not proxy CDN urls (they are already Supabase URLs)", () => {
    expect(resolveImages([], [CDN], "Helmet")[0].url).toBe(CDN);
  });

  it("keeps CDN order as the displayed order", () => {
    const b = CDN.replace("aa.webp", "bb.webp");
    const out = resolveImages(null, [CDN, b], "Helmet");
    expect(out.map((i) => i.url)).toEqual([CDN, b]);
    expect(out.map((i) => i.position)).toEqual([0, 1]);
  });
});

describe("resolveImages — legacy fallback", () => {
  it("falls back to legacy images when images_cdn is null/empty", () => {
    expect(resolveImages([LEGACY], null, "Helmet")).toHaveLength(1);
    expect(resolveImages([LEGACY], [], "Helmet")).toHaveLength(1);
  });

  it("routes legacy-host urls through the same-origin image proxy", () => {
    const out = resolveImages([LEGACY, LEGACY_BARE], null, "Helmet");
    expect(out[0].url).toBe(
      `/api/image-proxy?url=${encodeURIComponent(LEGACY)}`,
    );
    expect(out[1].url).toBe(
      `/api/image-proxy?url=${encodeURIComponent(LEGACY_BARE)}`,
    );
  });

  it("passes non-legacy urls through unproxied", () => {
    expect(resolveImages([CDN], null, "Helmet")[0].url).toBe(CDN);
  });

  it("normalizes a string[] into positioned images carrying the product alt", () => {
    expect(resolveImages([LEGACY], null, "Race Helmet")[0]).toMatchObject({
      alt: "Race Helmet",
      position: 0,
    });
  });

  it("preserves explicit position/alt on object images", () => {
    const out = resolveImages(
      [{ url: CDN, alt: "side", position: 2 }],
      null,
      "Helmet",
    );
    expect(out[0]).toMatchObject({ alt: "side", position: 2 });
  });

  it("returns an empty array when there are no images at all", () => {
    expect(resolveImages(null, null, "Helmet")).toEqual([]);
    expect(resolveImages([], [], "Helmet")).toEqual([]);
  });
});

describe("resolveImages — integrates with existing slot helpers", () => {
  it("primaryImage picks the CDN image when mirrored", () => {
    expect(primaryImage(resolveImages([LEGACY], [CDN], "x"))?.url).toBe(CDN);
  });

  it("galleryUrls yields proxied legacy urls on fallback", () => {
    expect(galleryUrls(resolveImages([LEGACY], null, "x"))[0]).toContain(
      "/api/image-proxy",
    );
  });
});

describe("primaryImageUrl — shared chat/storefront primitive", () => {
  it("returns the mirrored url when present", () => {
    expect(primaryImageUrl([LEGACY], [CDN])).toBe(CDN);
  });

  it("falls back to the proxied legacy url", () => {
    expect(primaryImageUrl([LEGACY], null)).toContain("/api/image-proxy");
  });

  it("resolves object-form legacy images (which the old chat pickImage missed)", () => {
    expect(primaryImageUrl([{ url: CDN, alt: "", position: 0 }], null)).toBe(
      CDN,
    );
  });

  it("returns null when there are no images", () => {
    expect(primaryImageUrl(null, null)).toBeNull();
    expect(primaryImageUrl([], [])).toBeNull();
  });
});
