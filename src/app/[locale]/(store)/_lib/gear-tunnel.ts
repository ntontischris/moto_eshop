/* Pure Gear Tunnel math + mode predicate — no DOM, fully unit-testable.
   The motion engine (motion-engine.ts) imports these to drive the pinned
   horizontal showcase; tests cover them directly. */

import { clamp } from "./motion";

/* Extra trailing room (px) so the last card clears the viewport edge before the
   pin releases — matches the spec's +64 gutter. */
export const TUNNEL_TAIL = 64;

/* Horizontal travel of the track while pinned: how far the track must slide so
   its right edge reaches the viewport's right edge, plus a tail. Never negative
   (a track narrower than the viewport stays put). */
export function tunnelScrollDistance(
  trackWidth: number,
  viewportWidth: number,
): number {
  return Math.max(0, trackWidth - viewportWidth + TUNNEL_TAIL);
}

/* Scroll/swipe position → progress bar fill in [0, 1]. Guards a zero-width
   track (single card / fits the viewport) by reporting fully complete. */
export function tunnelProgress(offset: number, distance: number): number {
  if (distance <= 0) return 1;
  return clamp(0, 1, offset / distance);
}

export interface TunnelMode {
  isWideViewport: boolean;
  hasFinePointer: boolean;
  prefersReducedMotion: boolean;
}

/* The tunnel pins + horizontally scrubs only on wide, fine-pointer, motion-OK
   devices. Touch / narrow / reduced-motion fall back to the CSS scroll-snap
   rail (no pin, no scroll hijack) so mobile stays clean. */
export function shouldPinTunnel(mode: TunnelMode): boolean {
  return (
    mode.isWideViewport && mode.hasFinePointer && !mode.prefersReducedMotion
  );
}
