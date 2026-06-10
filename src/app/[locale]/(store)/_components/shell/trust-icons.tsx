/* Stroke-draw trust icons. Each path/shape starts with stroke-dasharray/offset:1
   (CSS, pathLength normalised to 1) and the `is-drawn` class on the cell drives
   them to 0 over a staggered transition. Plain SVG so they are server-rendered
   and need no icon library. */

import type { ReactElement } from "react";

const SVG_PROPS = {
  viewBox: "0 0 24 24",
  width: 26,
  height: 26,
  fill: "none",
  "aria-hidden": true,
} as const;

export type TrustIconKey =
  | "official"
  | "delivery"
  | "fit"
  | "secure"
  | "support";

export const TRUST_ICONS: Record<TrustIconKey, ReactElement> = {
  official: (
    <svg {...SVG_PROPS}>
      <path d="M12 2l8 4v6c0 5-3.5 8.5-8 10-4.5-1.5-8-5-8-10V6l8-4z" />
      <path d="M9 12l2 2 4-4.5" />
    </svg>
  ),
  delivery: (
    <svg {...SVG_PROPS}>
      <path d="M3 7h13v10H3zM16 10h3l2 3v4h-5z" />
      <circle cx="7" cy="17" r="1.6" />
      <circle cx="18" cy="17" r="1.6" />
    </svg>
  ),
  fit: (
    <svg {...SVG_PROPS}>
      <path d="M3 12a9 9 0 109-9" />
      <path d="M3 5v7h7" />
    </svg>
  ),
  secure: (
    <svg {...SVG_PROPS}>
      <rect x="3" y="6" width="18" height="13" rx="2" />
      <path d="M3 10h18" />
    </svg>
  ),
  support: (
    <svg {...SVG_PROPS}>
      <path d="M4 13a8 8 0 0116 0" />
      <rect x="2" y="13" width="5" height="7" rx="1.5" />
      <rect x="17" y="13" width="5" height="7" rx="1.5" />
    </svg>
  ),
};
