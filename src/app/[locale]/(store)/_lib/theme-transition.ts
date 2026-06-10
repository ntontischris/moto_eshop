/* Pure helpers for the S4 "Race-day programme" theme switch — no DOM access,
   fully unit-testable. The provider wires these into document.startViewTransition
   and the --v3-vt-x / --v3-vt-y custom properties that drive the circular wipe. */

export interface WipeOrigin {
  x: number;
  y: number;
}

/* Centre of the toggle button, in viewport pixels — the origin the circular
   View-Transition wipe expands from. Falls back to the top-right corner (the
   button's resting spot) when no rect is available. */
export function wipeOriginFromRect(
  rect: { left: number; top: number; width: number; height: number } | null,
  viewport: { width: number; height: number },
): WipeOrigin {
  if (!rect) {
    return { x: viewport.width, y: 0 };
  }
  return {
    x: rect.left + rect.width / 2,
    y: rect.top + rect.height / 2,
  };
}

/* The wipe circle must cover the furthest viewport corner from the origin so no
   stale pixels are left behind. Returns the end radius in px. */
export function wipeEndRadius(
  origin: WipeOrigin,
  viewport: { width: number; height: number },
): number {
  const dx = Math.max(origin.x, viewport.width - origin.x);
  const dy = Math.max(origin.y, viewport.height - origin.y);
  return Math.hypot(dx, dy);
}

/* The animated wipe runs only when the browser supports View Transitions AND
   the user has not asked for reduced motion. Otherwise the theme flips instantly
   (the toggle still works — just without the circular reveal). */
export function shouldAnimateThemeSwitch(
  supportsViewTransitions: boolean,
  prefersReducedMotion: boolean,
): boolean {
  return supportsViewTransitions && !prefersReducedMotion;
}
