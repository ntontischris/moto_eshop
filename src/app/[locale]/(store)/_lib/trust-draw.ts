/* Pure draw-trigger logic for the trust block's stroke-draw icons — no DOM,
   testable in isolation. The component owns the IntersectionObserver; this only
   decides WHEN the one-shot draw should run given the inputs, so the policy
   (reduced-motion draws instantly, otherwise once on first reveal) is covered
   by a unit test instead of living implicitly inside an effect. */

export interface DrawDecisionInput {
  isIntersecting: boolean;
  hasDrawn: boolean;
  prefersReducedMotion: boolean;
}

/* Outcomes a trust cell can be in:
   - "instant": render fully drawn with no animation (reduced motion)
   - "animate": run the stroke-draw once now
   - "idle":    not yet revealed, stay undrawn
   - "done":    already drawn, do nothing */
export type DrawDecision = "instant" | "animate" | "idle" | "done";

export function decideDraw(input: DrawDecisionInput): DrawDecision {
  if (input.prefersReducedMotion) return "instant";
  if (input.hasDrawn) return "done";
  return input.isIntersecting ? "animate" : "idle";
}
