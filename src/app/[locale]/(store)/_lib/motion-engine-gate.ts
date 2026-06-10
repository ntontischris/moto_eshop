/* Pure gating predicates for the Velocità motion engine — no DOM, fully
   unit-testable. The provider (motion-provider.tsx) and engine
   (motion-engine.ts) import these; tests cover them directly. */

/* The GSAP/ScrollTrigger/Lenis motion engine is a desktop-only progressive
   enhancement. It runs only on fine-pointer (mouse, not touch) devices with
   motion allowed (no reduced-motion). On touch / coarse-pointer phones and
   under reduced-motion the static CSS/IntersectionObserver baseline stands on
   its own — so we never import or start the heavy engine there, keeping it off
   the mobile critical path (LCP / main thread). */
export function shouldRunMotionEngine(env: {
  isFinePointer: boolean;
  prefersReducedMotion: boolean;
}): boolean {
  return env.isFinePointer && !env.prefersReducedMotion;
}

/* A [data-reveal] group's entrance from-tween only runs if the group is NOT
   already in the viewport at engine start. Above-the-fold groups keep their
   visible CSS baseline (no opacity/transform mutation post-hydration), which
   avoids the layout shift the from-tween + clearProps caused on already-painted
   content. Below-fold groups animate in on scroll as before. */
export function shouldAnimateReveal(isInViewportAtStart: boolean): boolean {
  return !isInViewportAtStart;
}
