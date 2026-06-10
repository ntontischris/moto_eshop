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
