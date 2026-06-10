"use client";

import { useEffect } from "react";
import { shouldMountHeroRipple } from "../../_lib/hero-ripple";

/* HeroRippleProvider — mount point for the S15 WebGL hero ripple (issue #53).

   Renders nothing. Gates on desktop fine-pointer + motion-allowed + wide
   viewport (shouldMountHeroRipple). When allowed it waits for window `load`
   then an idle callback before dynamically importing the raw-WebGL engine, so
   none of it ships in the initial bundle and it never competes with LCP/TBT in
   the Lighthouse gate. Touch / reduced-motion / small screens never load it —
   the server-rendered poster stays as-is. The engine is fail-safe internally;
   its disposer runs on unmount. */

function scheduleIdle(run: () => void): () => void {
  if (typeof window.requestIdleCallback === "function") {
    const id = window.requestIdleCallback(run, { timeout: 2000 });
    return () => window.cancelIdleCallback(id);
  }
  const id = window.setTimeout(run, 800);
  return () => window.clearTimeout(id);
}

export function HeroRippleProvider() {
  useEffect(() => {
    if (typeof window === "undefined") return;

    const allowed = shouldMountHeroRipple({
      isFinePointer: window.matchMedia("(pointer: fine)").matches,
      prefersReducedMotion: window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches,
      viewportWidth: window.innerWidth,
    });
    if (!allowed) return;

    let cancelled = false;
    let dispose: (() => void) | undefined;
    let cancelIdle: (() => void) | undefined;

    const mount = () => {
      cancelIdle = scheduleIdle(() => {
        import("../../_lib/hero-ripple-engine")
          .then((mod) => {
            if (!cancelled) dispose = mod.start();
          })
          .catch(() => {
            /* engine chunk failed to load — static poster stays */
          });
      });
    };

    if (document.readyState === "complete") {
      mount();
    } else {
      window.addEventListener("load", mount, { once: true });
    }

    return () => {
      cancelled = true;
      window.removeEventListener("load", mount);
      cancelIdle?.();
      dispose?.();
    };
  }, []);

  return null;
}
