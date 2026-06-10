/* LQIP — tiny blur-up placeholders for the curated home imagery.
   `pnpm lqip:generate` (scripts/generate-lqip.ts) renders each source below
   into a ~16px webp data URI + intrinsic dimensions in lqip-manifest.json.
   Components look entries up by the exact src they render, paint the
   placeholder immediately and crossfade to the sharp image on load. */

import { HERO_POSTER, HERO_POSTER_MOBILE, PHOTO } from "./assets";
import manifest from "./lqip-manifest.json";

export interface LqipEntry {
  dataUri: string;
  width: number;
  height: number;
}

export const LQIP_DATA_URI_PREFIX = "data:image/webp;base64,";

/* Hard per-entry budget — placeholders are inlined into HTML/JS, so each one
   must stay tiny or the Lighthouse gate pays for it. */
export const LQIP_MAX_DATA_URI_LENGTH = 1600;

const RIDE_SELECTOR_SOURCES = [
  "racing",
  "adventure",
  "touring",
  "urban",
  "rain-winter",
  "parts",
].flatMap((ride) => [
  `/ride-selector/ride-${ride}.webp`,
  `/ride-selector/ride-${ride}-thumb.webp`,
]);

const CATEGORY_ATELIER_SOURCES = [
  "helmets",
  "jackets",
  "gloves",
  "boots",
  "luggage",
  "service",
  "phone-mount",
  "off-road",
].map((name) => `/category-atelier/${name}.webp`);

/* The curated home set: hero poster pair, ride selector set, category
   atelier tiles, bike-finder backdrop, editorial photo. */
export const LQIP_SOURCES: readonly string[] = [
  HERO_POSTER,
  HERO_POSTER_MOBILE,
  ...RIDE_SELECTOR_SOURCES,
  ...CATEGORY_ATELIER_SOURCES,
  "/mega-menu/category-my-bike.webp",
  PHOTO.editorial,
];

const BASE64_RE = /^[A-Za-z0-9+/]+={0,2}$/;

function isPositiveInt(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value > 0;
}

/* Output contract for a generated placeholder: a small base64 webp data URI
   plus the intrinsic dimensions of the source image. */
export function isLqipEntry(value: unknown): value is LqipEntry {
  if (typeof value !== "object" || value === null) return false;
  const { dataUri, width, height } = value as Record<string, unknown>;
  if (typeof dataUri !== "string") return false;
  if (!dataUri.startsWith(LQIP_DATA_URI_PREFIX)) return false;
  if (dataUri.length > LQIP_MAX_DATA_URI_LENGTH) return false;
  if (!BASE64_RE.test(dataUri.slice(LQIP_DATA_URI_PREFIX.length))) return false;
  return isPositiveInt(width) && isPositiveInt(height);
}

export function getLqip(src: string): LqipEntry | undefined {
  const entry = (manifest as Record<string, unknown>)[src];
  return isLqipEntry(entry) ? entry : undefined;
}

/* Background stack for the placeholder layer: blurred LQIP over the designed
   gradient, so a missing/blocked image never leaves a visual hole. */
export function lqipBackground(src: string): string {
  const entry = getLqip(src);
  const gradient = "var(--v3-lqip-fallback)";
  return entry ? `url("${entry.dataUri}"), ${gradient}` : gradient;
}
