/* Pure state machine for the Ride Cinema auto-rotation (S46). No DOM access,
   fully unit-testable. The component (race-control-panel.tsx) wires these into
   a timer, IntersectionObserver, hover/focus handlers and prefers-reduced-motion.

   Autoplay pauses while ANY reason is active (hover, focus-within, off-screen,
   tab hidden). Reasons compose as a set so independent sources never clobber
   each other — leaving hover must not resume if the section is still off-screen. */

export type RidePauseReason = "hover" | "focus" | "offscreen" | "hidden";

export interface RideRotationState {
  activeIndex: number;
  pauseReasons: ReadonlySet<RidePauseReason>;
}

export type RideRotationAction =
  | { type: "select"; index: number }
  | { type: "advance" }
  | { type: "pause"; reason: RidePauseReason }
  | { type: "resume"; reason: RidePauseReason };

/* The next ride in the loop, wrapping past the last back to the first. */
export function nextRideIndex(current: number, total: number): number {
  return (current + 1) % total;
}

/* Autoplay runs only when nothing is asking it to pause. */
export function isRotationRunning(state: RideRotationState): boolean {
  return state.pauseReasons.size === 0;
}

export function createRideRotationState(activeIndex = 0): RideRotationState {
  return { activeIndex, pauseReasons: new Set() };
}

function withReason(
  reasons: ReadonlySet<RidePauseReason>,
  reason: RidePauseReason,
): ReadonlySet<RidePauseReason> {
  if (reasons.has(reason)) return reasons;
  return new Set(reasons).add(reason);
}

function withoutReason(
  reasons: ReadonlySet<RidePauseReason>,
  reason: RidePauseReason,
): ReadonlySet<RidePauseReason> {
  if (!reasons.has(reason)) return reasons;
  const next = new Set(reasons);
  next.delete(reason);
  return next;
}

/* Reducer over the rotation. `total` is passed via closure so the reducer stays
   pure and the ride list never has to live in state. */
export function rideRotationReducer(
  total: number,
): (state: RideRotationState, action: RideRotationAction) => RideRotationState {
  return (state, action) => {
    switch (action.type) {
      case "select":
        if (action.index === state.activeIndex) return state;
        return { ...state, activeIndex: action.index };
      case "advance":
        return {
          ...state,
          activeIndex: nextRideIndex(state.activeIndex, total),
        };
      case "pause": {
        const pauseReasons = withReason(state.pauseReasons, action.reason);
        if (pauseReasons === state.pauseReasons) return state;
        return { ...state, pauseReasons };
      }
      case "resume": {
        const pauseReasons = withoutReason(state.pauseReasons, action.reason);
        if (pauseReasons === state.pauseReasons) return state;
        return { ...state, pauseReasons };
      }
    }
  };
}
