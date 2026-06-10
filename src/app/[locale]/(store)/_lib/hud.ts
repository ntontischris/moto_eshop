/* Pure HUD chrome logic — no DOM, fully unit-testable. The track-rail and
   mobile-CTA components import these; tests cover them directly. */

import { clamp } from "./motion";

/* Gears shown on the rail HUD. Index 0 is the resting "N" (neutral, before any
   section is crossed); each subsequent section shifts up to the next gear, the
   highest capping at 6 (a six-speed box). The order matches the page's data-gear
   sections top-to-bottom. */
export const NEUTRAL_GEAR = "N";
export const TOP_GEAR = 6;

/* Section index (0-based, in document order) → gear label. Before the first
   section is the active one we sit in neutral; the first section is 1st gear,
   and we never shift past the top gear no matter how many sections follow. */
export function gearForSection(activeSectionIndex: number): string {
  if (activeSectionIndex < 0) return NEUTRAL_GEAR;
  return String(Math.min(activeSectionIndex + 1, TOP_GEAR));
}

/* Which section "owns" the viewport: the last section whose activation line
   (a fraction down the viewport) the section's top has crossed. Returns -1 when
   no section has been reached yet (still in neutral above the first one).
   `tops` are section top offsets in document order; `scrollLine` is the absolute
   document Y of the activation line (scrollY + viewportHeight * activationRatio). */
export function activeSectionIndex(tops: number[], scrollLine: number): number {
  let index = -1;
  for (let i = 0; i < tops.length; i += 1) {
    if (tops[i] <= scrollLine) index = i;
  }
  return index;
}

/* Overall vertical scroll progress in [0, 1] for the rail fill. Guards a page
   that fits the viewport (nothing to scroll) by reporting empty. */
export function scrollProgress(
  scrollY: number,
  scrollHeight: number,
  viewportHeight: number,
): number {
  const scrollable = scrollHeight - viewportHeight;
  if (scrollable <= 0) return 0;
  return clamp(0, 1, scrollY / scrollable);
}

/* Mobile sticky CTA visibility predicate: shown once the visitor has scrolled
   past the hero, hidden again as the footer comes into view so it never covers
   the footer's links / payment info. All inputs are absolute document Y / px. */
export function isStickyCtaVisible(input: {
  scrollY: number;
  heroBottom: number;
  footerTop: number;
  viewportHeight: number;
}): boolean {
  const { scrollY, heroBottom, footerTop, viewportHeight } = input;
  const pastHero = scrollY >= heroBottom;
  const beforeFooter = scrollY + viewportHeight < footerTop;
  return pastHero && beforeFooter;
}
