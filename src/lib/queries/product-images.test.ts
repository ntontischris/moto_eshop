import { describe, it, expect } from "vitest";
import {
  sortByPosition,
  primaryImage,
  secondaryImage,
  galleryUrls,
} from "./product-images";

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
