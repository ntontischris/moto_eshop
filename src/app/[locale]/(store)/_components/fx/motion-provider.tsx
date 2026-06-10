"use client";

import { useEffect } from "react";

/* MotionProvider — the Velocità motion foundation's mount point.

   Renders nothing. After hydration it dynamically imports the motion engine
   (GSAP + ScrollTrigger + Lenis) so none of that ships in the server payload.
   Global kill switch: under prefers-reduced-motion it never loads the engine,
   leaving the CSS baseline (visible content + gentle CSS marquee loop) intact.
   The engine's disposer runs on unmount / locale change. */

export function MotionProvider() {
  useEffect(() => {
    if (
      typeof window === "undefined" ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      return;
    }

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
