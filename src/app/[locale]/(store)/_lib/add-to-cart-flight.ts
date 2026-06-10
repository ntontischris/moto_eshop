/* Pure logic for the S49 add-to-cart micro-interaction — no DOM, fully
   unit-testable. The hook (use-add-to-cart-flight.ts) imports these; tests
   cover them directly.

   Two concerns live here:
   - the morph STATE MACHINE driving the button label → spinner → check → reset
     cycle (idle → pending → success/error → idle), guarding against
     double-taps;
   - the ARC FLIGHT PATH math: a quadratic Bézier from the button to the header
     cart icon, lifted into an arc, sampled into transform frames.
   This layer never touches the cart contract (ADR 0001): it only decides
   timing and geometry for the presentation. */

export type CartMorphState = "idle" | "pending" | "success" | "error";

/* The morph advances through a fixed cycle. `pending` is entered only from a
   settled state (idle/success/error), which is what makes the button
   double-tap safe — a second press while pending is ignored. */
export function nextMorphState(
  current: CartMorphState,
  event: "press" | "resolve" | "reject" | "reset",
): CartMorphState {
  switch (event) {
    case "press":
      // A press always lands in pending; the hook gates re-presses while
      // pending via canStartAdd(), so this stays a no-op for double-taps.
      return "pending";
    case "resolve":
      return current === "pending" ? "success" : current;
    case "reject":
      return current === "pending" ? "error" : current;
    case "reset":
      return "idle";
  }
}

/* A settled state can start a new request; a pending one cannot. The hook reads
   this before doing any work so a rapid double-tap never fires two adds. */
export function canStartAdd(current: CartMorphState): boolean {
  return current !== "pending";
}

export interface Point {
  x: number;
  y: number;
}

/* How high the flight arcs above the straight line between origin and target,
   as a fraction of the horizontal distance, clamped so short hops still lift
   visibly and long ones never balloon. */
const ARC_LIFT_RATIO = 0.4;
const ARC_LIFT_MIN = 60;
const ARC_LIFT_MAX = 220;

/* The single Bézier control point that bends the straight origin→target line
   into an upward arc (screen y grows downward, so we subtract the lift). The
   control sits at the horizontal midpoint, raised above the higher endpoint. */
export function arcControlPoint(origin: Point, target: Point): Point {
  const span = Math.abs(target.x - origin.x);
  const lift = clamp(ARC_LIFT_MIN, ARC_LIFT_MAX, span * ARC_LIFT_RATIO);
  return {
    x: (origin.x + target.x) / 2,
    y: Math.min(origin.y, target.y) - lift,
  };
}

/* Sample the quadratic Bézier origin→control→target into `steps`+1 points
   (inclusive of both ends). `steps` below 1 collapses to the two endpoints, so
   reduced-motion callers can still resolve a degenerate path safely. */
export function arcFlightPath(
  origin: Point,
  target: Point,
  steps: number,
): Point[] {
  const control = arcControlPoint(origin, target);
  const safeSteps = steps < 1 ? 1 : Math.floor(steps);
  return Array.from({ length: safeSteps + 1 }, (_, i) =>
    quadraticBezier(origin, control, target, i / safeSteps),
  );
}

function quadraticBezier(p0: Point, p1: Point, p2: Point, t: number): Point {
  const mt = 1 - t;
  return {
    x: mt * mt * p0.x + 2 * mt * t * p1.x + t * t * p2.x,
    y: mt * mt * p0.y + 2 * mt * t * p1.y + t * t * p2.y,
  };
}

/* The ghost shrinks as it nears the cart, from full size down to a dot. Eased
   on the same 0..1 progress the path uses. */
export function flightScale(progress: number): number {
  const MIN_SCALE = 0.2;
  const p = clamp01(progress);
  return 1 - (1 - MIN_SCALE) * p;
}

function clamp(min: number, max: number, value: number): number {
  return value < min ? min : value > max ? max : value;
}

function clamp01(value: number): number {
  return value < 0 ? 0 : value > 1 ? 1 : value;
}
