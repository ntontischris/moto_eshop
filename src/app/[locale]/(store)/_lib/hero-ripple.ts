/* Pure gating + math helpers for the S15 WebGL hero ripple — no DOM, fully
   unit-testable. The engine (hero-ripple-engine.ts) and provider import these;
   tests cover the predicates directly. */

/* The ripple is a desktop-only progressive enhancement. It mounts only when:
   pointer is fine (mouse, not touch), motion is allowed (no reduced-motion),
   and the viewport is wide enough to be a desktop. Any false → static poster
   stays, exactly as the no-JS baseline. */
export function shouldMountHeroRipple(env: {
  isFinePointer: boolean;
  prefersReducedMotion: boolean;
  viewportWidth: number;
}): boolean {
  const DESKTOP_MIN_WIDTH = 1024;
  return (
    env.isFinePointer &&
    !env.prefersReducedMotion &&
    env.viewportWidth >= DESKTOP_MIN_WIDTH
  );
}

/* devicePixelRatio is capped at 1.5 so the ripple never renders at retina-3x
   cost. Guards against undefined / non-finite / sub-1 values too. */
export function cappedDevicePixelRatio(rawRatio: number): number {
  const DPR_CAP = 1.5;
  if (!Number.isFinite(rawRatio) || rawRatio < 1) return 1;
  return Math.min(rawRatio, DPR_CAP);
}

/* Normalised pointer speed (0..1) driving ripple strength: distance travelled
   between two normalised positions, amplified, clamped. */
export function pointerSpeedToStrength(
  prev: { x: number; y: number },
  next: { x: number; y: number },
): number {
  const AMPLIFY = 14;
  const speed = Math.hypot(next.x - prev.x, next.y - prev.y) * AMPLIFY;
  return Math.min(1, speed);
}

/* Maps signed scroll velocity (px/s) to the chromatic-aberration drive (0..8).
   Magnitude only; direction is irrelevant to the colour split. */
export function scrollVelocityToChroma(velocity: number): number {
  const DIVISOR = 350;
  const MAX = 8;
  return Math.min(MAX, Math.abs(velocity / DIVISOR));
}
