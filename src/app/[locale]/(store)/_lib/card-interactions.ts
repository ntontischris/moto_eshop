/* Pure logic for Velocità product-card interactions (S48) — no DOM, fully
   unit-testable. The card components import these; tests cover them directly.

   Three concerns live here:
   - the predicate deciding whether rich interactions may run at all,
   - the 3D tilt transform math (pointer position → CSS transform),
   - the price odometer digit sequencing (final price → roll frames).
   Pricing is server-authoritative (ADR 0001): the odometer only animates the
   already-rendered value, it never computes or alters a price. */

export interface PointerCapabilities {
  hasFinePointer: boolean;
  prefersReducedMotion: boolean;
}

/* Rich interactions (tilt + odometer roll) run only on a precise pointer that
   can hover, and never when the visitor asked for reduced motion. Touch
   devices and reduced-motion users fall back to the static, instant card. */
export function canRunCardInteractions(caps: PointerCapabilities): boolean {
  return caps.hasFinePointer && !caps.prefersReducedMotion;
}

const TILT_MAX_DEG = 7;
const TILT_LIFT_PX = 12;

/* Map a normalised pointer position inside the card (0..1 on each axis) to a
   3D tilt transform that leans the card toward the cursor. Transform-only, so
   it stays on the compositor and never reflows. */
export function tiltTransform(normX: number, normY: number): string {
  const px = clamp01(normX);
  const py = clamp01(normY);
  const rotateX = ((0.5 - py) * TILT_MAX_DEG * 2).toFixed(2);
  const rotateY = ((px - 0.5) * TILT_MAX_DEG * 2).toFixed(2);
  return `perspective(900px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateZ(${TILT_LIFT_PX}px)`;
}

/* The neutral transform the card elastically returns to on pointer leave. */
export function tiltRestTransform(): string {
  return "perspective(900px) rotateX(0deg) rotateY(0deg)";
}

function clamp01(value: number): number {
  return value < 0 ? 0 : value > 1 ? 1 : value;
}

/* A single column of the odometer: its target digit plus the intermediate
   digits it rolls through to reach it. Non-digit characters (currency symbol,
   decimal comma, spaces) are passed through with an empty roll. */
export interface OdometerColumn {
  char: string;
  isDigit: boolean;
  roll: string[];
}

/* Break a formatted price string into odometer columns. Each digit rolls up
   through `steps` intermediate values before landing on its final digit, which
   is what produces the mechanical "counter" feel. Steps below 1 (or
   reduced-motion callers) yield columns that land instantly on the value. */
export function odometerColumns(
  formattedPrice: string,
  steps: number,
): OdometerColumn[] {
  const safeSteps = steps < 1 ? 0 : Math.floor(steps);
  return Array.from(formattedPrice).map((char) => {
    const isDigit = char >= "0" && char <= "9";
    return {
      char,
      isDigit,
      roll: isDigit ? rollSequence(char, safeSteps) : [],
    };
  });
}

/* The digits a column passes through, ending on `target`. With `steps` extra
   frames the roll climbs `steps` digits below the target up to it (wrapping
   0-9), so "5" with 3 steps rolls 2 → 3 → 4 → 5. */
function rollSequence(target: string, steps: number): string[] {
  const end = target.charCodeAt(0) - 48;
  const frames: string[] = [];
  for (let offset = steps; offset >= 0; offset--) {
    frames.push(String((((end - offset) % 10) + 10) % 10));
  }
  return frames;
}
