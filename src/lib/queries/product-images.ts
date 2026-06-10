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

const LEGACY_IMAGE_HOSTS = [
  "https://www.motomarket-shop.gr/",
  "https://motomarket-shop.gr/",
];

/**
 * Route a legacy-eshop image URL through our same-origin proxy (the legacy
 * origin 403s the Next.js optimizer). Non-legacy URLs (Supabase, local) pass
 * through untouched.
 */
function proxyIfLegacy(url: string): string {
  if (LEGACY_IMAGE_HOSTS.some((host) => url.startsWith(host))) {
    return `/api/image-proxy?url=${encodeURIComponent(url)}`;
  }
  return url;
}

/**
 * The single home for turning a product's stored image data into the display
 * set every read path renders (ADR 0005). Prefers the **Mirrored image**
 * (`images_cdn`, already Supabase URLs) wholesale when present; otherwise falls
 * back to the **Legacy image** (`images`, raw `string[]` or object form),
 * normalized and proxied. Returns the positioned shape the slot helpers expect.
 */
export function resolveImages(
  rawImages: unknown,
  rawCdn: unknown,
  alt = "",
): PositionedImage[] {
  const cdn = Array.isArray(rawCdn)
    ? rawCdn.filter((u): u is string => typeof u === "string" && u.length > 0)
    : [];
  if (cdn.length > 0) {
    return cdn.map((url, position) => ({ url, alt, position }));
  }

  const legacy = Array.isArray(rawImages) ? rawImages : [];
  return legacy.map((img, idx) => {
    if (typeof img === "string") {
      return { url: proxyIfLegacy(img), alt, position: idx };
    }
    const obj = (img ?? {}) as Partial<PositionedImage>;
    return {
      url: proxyIfLegacy(obj.url ?? ""),
      alt: obj.alt ?? alt,
      position: obj.position ?? idx,
    };
  });
}

/**
 * The single best display URL for a product (Mirrored image first, else proxied
 * legacy), or null when it has no images. The shared primitive behind the chat
 * tools so they pick the same image as the storefront.
 */
export function primaryImageUrl(
  rawImages: unknown,
  rawCdn: unknown,
): string | null {
  return primaryImage(resolveImages(rawImages, rawCdn))?.url ?? null;
}

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
