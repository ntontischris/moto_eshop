import { describe, it, expect } from "vitest";
import sharp from "sharp";
import {
  MAX_EDGE,
  WEBP_QUALITY,
  storagePathFor,
  encodeWebp,
  sourceUrls,
  mapWithConcurrency,
} from "./mirror";

describe("storagePathFor", () => {
  const url = "https://www.motomarket-shop.gr/img/abc-123.jpg";

  it("is deterministic: the same URL always yields the same path", () => {
    expect(storagePathFor(url)).toBe(storagePathFor(url));
  });

  it("yields different paths for different URLs", () => {
    expect(storagePathFor(url)).not.toBe(
      storagePathFor(url.replace("abc-123", "abc-124")),
    );
  });

  it("produces a sha1 hex name with a .webp extension", () => {
    expect(storagePathFor(url)).toMatch(/^[0-9a-f]{40}\.webp$/);
  });
});

describe("encodeWebp", () => {
  it("re-encodes any input to WebP", async () => {
    const png = await sharp({
      create: {
        width: 64,
        height: 64,
        channels: 3,
        background: { r: 10, g: 20, b: 30 },
      },
    })
      .png()
      .toBuffer();

    const out = await encodeWebp(png);
    const meta = await sharp(out).metadata();
    expect(meta.format).toBe("webp");
  });

  it("caps the longest edge to MAX_EDGE without upscaling smaller images", async () => {
    const wide = await sharp({
      create: {
        width: MAX_EDGE * 2,
        height: 200,
        channels: 3,
        background: { r: 0, g: 0, b: 0 },
      },
    })
      .png()
      .toBuffer();

    const cappedMeta = await sharp(await encodeWebp(wide)).metadata();
    expect(cappedMeta.width).toBe(MAX_EDGE);

    const small = await sharp({
      create: {
        width: 100,
        height: 80,
        channels: 3,
        background: { r: 0, g: 0, b: 0 },
      },
    })
      .png()
      .toBuffer();

    const smallMeta = await sharp(await encodeWebp(small)).metadata();
    expect(smallMeta.width).toBe(100); // not enlarged
  });

  it("exposes the cap and quality as named constants", () => {
    expect(MAX_EDGE).toBe(1600);
    expect(WEBP_QUALITY).toBe(75);
  });
});

describe("sourceUrls", () => {
  it("extracts http(s) urls from a string[] in order", () => {
    expect(sourceUrls(["https://a.com/1.jpg", "http://a.com/2.jpg"])).toEqual([
      "https://a.com/1.jpg",
      "http://a.com/2.jpg",
    ]);
  });

  it("extracts urls from object-form images", () => {
    expect(
      sourceUrls([
        { url: "https://a.com/1.jpg", alt: "", position: 0 },
        { url: "https://a.com/2.jpg", alt: "", position: 1 },
      ]),
    ).toEqual(["https://a.com/1.jpg", "https://a.com/2.jpg"]);
  });

  it("drops non-http entries, blanks, and already-mirrored relative/proxy urls", () => {
    expect(
      sourceUrls([
        "https://a.com/ok.jpg",
        "/api/image-proxy?url=x",
        "",
        123,
        {},
        null,
      ]),
    ).toEqual(["https://a.com/ok.jpg"]);
  });

  it("returns [] for non-array input", () => {
    expect(sourceUrls(null)).toEqual([]);
    expect(sourceUrls(undefined)).toEqual([]);
    expect(sourceUrls("nope")).toEqual([]);
  });
});

describe("mapWithConcurrency", () => {
  it("maps every item and preserves order", async () => {
    const out = await mapWithConcurrency([1, 2, 3, 4], 2, async (n) => n * 10);
    expect(out).toEqual([10, 20, 30, 40]);
  });

  it("never runs more than `limit` tasks at once", async () => {
    let active = 0;
    let peak = 0;
    const work = Array.from({ length: 8 }, (_, i) => i);
    await mapWithConcurrency(work, 3, async (n) => {
      active++;
      peak = Math.max(peak, active);
      await new Promise((r) => setTimeout(r, 5));
      active--;
      return n;
    });
    expect(peak).toBeLessThanOrEqual(3);
    expect(peak).toBeGreaterThan(1);
  });

  it("handles an empty list", async () => {
    expect(await mapWithConcurrency([], 4, async (n) => n)).toEqual([]);
  });
});
