/* Pure motion math for the Velocità engine — no DOM, fully unit-testable.
   The engine (motion-engine.ts) imports these; tests cover them directly. */

export function clamp(min: number, max: number, value: number): number {
  return value < min ? min : value > max ? max : value;
}

/* Map ScrollTrigger velocity (px/s, signed) to a marquee skew angle (deg).
   Scrolling down (positive velocity) leans the track one way; up leans back.
   Bounded so fast flings never over-skew into illegibility. */
export function velocityToSkew(velocity: number): number {
  return clamp(-12, 12, velocity / -220);
}

/* Map velocity magnitude to a marquee loop timeScale. At rest the loop runs at
   1×; faster scrolling accelerates the marquee up to 3.5×. */
export function velocityToTimeScale(velocity: number): number {
  return clamp(1, 3.5, Math.abs(velocity / 800) + 1);
}
