/**
 * Pure core for the product-image evacuation (ADR 0005). These helpers carry no
 * I/O so they can be unit-tested without touching Supabase or the network — the
 * runnable orchestration lives in `scripts/mirror-images.ts`, a thin wrapper.
 */

import { createHash } from "node:crypto";
import sharp from "sharp";

/** Longest-edge cap for a mirrored image; responsive sizing is the optimizer's job. */
export const MAX_EDGE = 1600;

/** WebP quality for mirrored images. */
export const WEBP_QUALITY = 75;

/**
 * Deterministic storage key for a mirrored image, derived from its source URL.
 * A re-run computes the same path, so an already-uploaded image is skipped —
 * this is the idempotency mechanism. Never use a random path here (that would
 * duplicate objects on every run).
 */
export function storagePathFor(sourceUrl: string): string {
  return `${createHash("sha1").update(sourceUrl).digest("hex")}.webp`;
}

/**
 * Re-encode an image buffer to a single WebP, capped to `MAX_EDGE` on its
 * longest side and never upscaled. EXIF orientation is baked in so the stored
 * pixels are display-correct.
 */
export async function encodeWebp(input: Buffer): Promise<Buffer> {
  return sharp(input)
    .rotate()
    .resize({
      width: MAX_EDGE,
      height: MAX_EDGE,
      fit: "inside",
      withoutEnlargement: true,
    })
    .webp({ quality: WEBP_QUALITY })
    .toBuffer();
}

/**
 * Raw downloadable source URLs from a product's stored `images` (string[] or
 * object form), in position order. Already-mirrored relative/proxy URLs and
 * non-http junk are dropped — the mirror only fetches absolute legacy origins.
 */
export function sourceUrls(rawImages: unknown): string[] {
  const arr = Array.isArray(rawImages) ? rawImages : [];
  return arr
    .map((img) =>
      typeof img === "string" ? img : ((img as { url?: unknown })?.url ?? ""),
    )
    .filter(
      (u): u is string => typeof u === "string" && /^https?:\/\//.test(u),
    );
}

/**
 * Run `fn` over `items` with at most `limit` in flight at once, preserving
 * input order in the result. Keeps the evacuation from opening thousands of
 * sockets against the legacy origin at once (no p-limit dependency needed).
 */
export async function mapWithConcurrency<T, R>(
  items: readonly T[],
  limit: number,
  fn: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
  const results = new Array<R>(items.length);
  let next = 0;
  const workers = Array.from(
    { length: Math.max(1, Math.min(limit, items.length)) },
    async () => {
      while (next < items.length) {
        const i = next++;
        results[i] = await fn(items[i], i);
      }
    },
  );
  await Promise.all(workers);
  return results;
}
