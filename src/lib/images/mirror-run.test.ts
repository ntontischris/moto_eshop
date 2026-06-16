import { describe, it, expect, vi } from "vitest";
import {
  parseMirrorArgs,
  legacyImageUrls,
  mapWithConcurrency,
  formatReport,
  DEFAULT_CONCURRENCY,
  type MirrorReport,
} from "./mirror-run";

describe("parseMirrorArgs", () => {
  it("defaults to a real run with no limit and the default concurrency", () => {
    expect(parseMirrorArgs([])).toEqual({
      dryRun: false,
      limit: null,
      concurrency: DEFAULT_CONCURRENCY,
    });
  });

  it("reads --dry-run, --limit N and --concurrency K", () => {
    expect(
      parseMirrorArgs(["--dry-run", "--limit", "50", "--concurrency", "3"]),
    ).toEqual({
      dryRun: true,
      limit: 50,
      concurrency: 3,
    });
  });

  it("ignores a non-positive or missing --limit value", () => {
    expect(parseMirrorArgs(["--limit", "0"]).limit).toBeNull();
    expect(parseMirrorArgs(["--limit"]).limit).toBeNull();
    expect(parseMirrorArgs(["--limit", "-4"]).limit).toBeNull();
  });

  it("falls back to the default concurrency when the value is invalid", () => {
    expect(parseMirrorArgs(["--concurrency", "0"]).concurrency).toBe(
      DEFAULT_CONCURRENCY,
    );
    expect(parseMirrorArgs(["--concurrency", "nope"]).concurrency).toBe(
      DEFAULT_CONCURRENCY,
    );
  });
});

describe("legacyImageUrls", () => {
  it("returns string-form images in array order", () => {
    expect(legacyImageUrls(["https://a/1.jpg", "https://a/2.jpg"])).toEqual([
      "https://a/1.jpg",
      "https://a/2.jpg",
    ]);
  });

  it("orders object-form images by position", () => {
    expect(
      legacyImageUrls([
        { url: "https://a/b.jpg", position: 1 },
        { url: "https://a/a.jpg", position: 0 },
      ]),
    ).toEqual(["https://a/a.jpg", "https://a/b.jpg"]);
  });

  it("drops empty and non-string urls and tolerates non-array input", () => {
    expect(
      legacyImageUrls([{ url: "" }, "https://a/1.jpg", { foo: 1 }]),
    ).toEqual(["https://a/1.jpg"]);
    expect(legacyImageUrls(null)).toEqual([]);
    expect(legacyImageUrls(undefined)).toEqual([]);
  });
});

describe("mapWithConcurrency", () => {
  it("preserves input order in the results", async () => {
    const out = await mapWithConcurrency([1, 2, 3, 4], 2, async (n) => n * 10);
    expect(out).toEqual([10, 20, 30, 40]);
  });

  it("never runs more than `limit` tasks at once", async () => {
    let active = 0;
    let peak = 0;
    const defer = () => new Promise((r) => setTimeout(r, 5));
    await mapWithConcurrency([1, 2, 3, 4, 5, 6], 2, async () => {
      active++;
      peak = Math.max(peak, active);
      await defer();
      active--;
    });
    expect(peak).toBeLessThanOrEqual(2);
  });

  it("runs every item even when the pool is wider than the list", async () => {
    const fn = vi.fn(async (n: number) => n);
    await mapWithConcurrency([1, 2], 10, fn);
    expect(fn).toHaveBeenCalledTimes(2);
  });
});

describe("formatReport", () => {
  const base: MirrorReport = {
    products: 3,
    productsOk: 2,
    productsFailed: 1,
    imagesUploaded: 4,
    imagesSkipped: 1,
    failures: [{ source: "https://a/bad.jpg", reason: "upstream 404" }],
  };

  it("summarises counts and lists every failure with its source url", () => {
    const out = formatReport(base);
    expect(out).toContain("3 products");
    expect(out).toContain("✓ 2");
    expect(out).toContain("✗ 1");
    expect(out).toContain("4 uploaded");
    expect(out).toContain("1 skipped");
    expect(out).toContain("https://a/bad.jpg");
    expect(out).toContain("upstream 404");
  });

  it("shows a clean all-clear when there are no failures", () => {
    const out = formatReport({ ...base, productsFailed: 0, failures: [] });
    expect(out).toContain("✓");
    expect(out).not.toMatch(/✗ [1-9]/);
  });
});
