"use client";

import { useEffect } from "react";
import { shouldRunMotionEngine } from "../../_lib/motion-engine-gate";

/* MotionProvider — the Velocità motion foundation's mount point.

   Renders nothing. After hydration it dynamically imports the motion engine
   (GSAP + ScrollTrigger + Lenis) so none of that ships in the server payload.
   Gated on fine-pointer + motion-allowed (shouldRunMotionEngine): touch /
   coarse-pointer phones and reduced-motion users never download or start the
   heavy engine, leaving the static CSS/IntersectionObserver baseline (visible
   content + gentle CSS marquee loop) as the full mobile experience — keeping
   the engine off the mobile LCP / main-thread critical path. The engine's
   disposer runs on unmount / locale change. */

export function MotionProvider() {
  useEffect(() => {
    if (typeof window === "undefined") return;

    const allowed = shouldRunMotionEngine({
      isFinePointer: window.matchMedia("(pointer: fine)").matches,
      prefersReducedMotion: window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches,
    });
    if (!allowed) return;

    let dispose: (() => void) | undefined;
    let cancelled = false;

    import("../../_lib/motion-engine")
      .then((mod) => {
        if (!cancelled) dispose = mod.start();
      })
      .catch(() => {
        /* engine failed to load — CSS baseline still renders all content */
      });

    return () => {
      cancelled = true;
      dispose?.();
    };
  }, []);

  return null;
}
