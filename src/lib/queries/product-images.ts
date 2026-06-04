/**
 * Single source for product image shaping. Catalog reads (product queries,
 * cart projection, Meilisearch sync) all order images by `position` and pick
 * the same primary/secondary/gallery slots — that logic lives here so the
 * read paths cannot drift.
 */

export interface PositionedImage {
  url: string;
  alt: string;
  position: number;
}

/** Fallback when a product has no images. */
export const PLACEHOLDER_PRODUCT_IMAGE = "/images/placeholder-product.webp";

/** Images ordered by ascending `position` (non-mutating). */
export function sortByPosition<T extends PositionedImage>(images: T[]): T[] {
  return [...images].sort((a, b) => a.position - b.position);
}

/** First image by position, or null when there are none. */
export function primaryImage<T extends PositionedImage>(images: T[]): T | null {
  if (images.length === 0) return null;
  return sortByPosition(images)[0] ?? null;
}

/**
 * Second image by position — powers the on-hover swap in product cards.
 * Null when a product has only one shot.
 */
export function secondaryImage<T extends PositionedImage>(
  images: T[],
): T | null {
  if (images.length < 2) return null;
  return sortByPosition(images)[1] ?? null;
}

/**
 * All image URLs by position, capped — powers the on-hover image cycle on
 * landing product cards. Capped to keep the RSC payload bounded.
 */
export function galleryUrls(images: PositionedImage[], cap = 6): string[] {
  return sortByPosition(images)
    .map((img) => img.url)
    .filter(Boolean)
    .slice(0, cap);
}
