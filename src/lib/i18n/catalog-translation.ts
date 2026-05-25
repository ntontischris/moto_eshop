/**
 * Pure helpers for the catalog translation pipeline: deterministic source
 * hashing (to detect staleness), change detection, and batching. No IO.
 */

import { createHash } from "node:crypto";

export interface SourceFields {
  name: string;
  description?: string | null;
}

/**
 * Deterministic SHA-1 of the translatable source fields. Used to detect when a
 * product's source content changed and its translation needs refreshing.
 */
export const sourceHash = (s: SourceFields): string =>
  createHash("sha1")
    .update(`${s.name} ${s.description ?? ""}`)
    .digest("hex");

/**
 * True when there is no existing translation, or the existing translation was
 * produced from a different source revision (hash mismatch).
 */
export const needsTranslation = (
  src: SourceFields,
  existing: { source_hash?: string | null } | null | undefined,
): boolean => !existing || existing.source_hash !== sourceHash(src);

/** Split an array into chunks of at most `size` (remainder kept). */
export function chunk<T>(arr: T[], size: number): T[][] {
  if (size <= 0) throw new Error("chunk size must be a positive integer");
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    out.push(arr.slice(i, i + size));
  }
  return out;
}
