"use client";

import { useEffect, useRef } from "react";

/* ScrollProgress — thin top bar. CWV-safe: passive scroll listener, rAF-
   throttled, mutates only transform: scaleX (compositor). Hidden under
   reduced-motion. */

export function ScrollProgress() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (
      window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
      typeof window === "undefined"
    ) {
      return;
    }
    let raf = 0;
    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        const h = document.documentElement.scrollHeight - window.innerHeight;
        const p = h > 0 ? window.scrollY / h : 0;
        if (ref.current) {
          ref.current.style.transform = `scaleX(${Math.min(1, p)})`;
        }
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div className="v3-prog" aria-hidden="true">
      <div ref={ref} className="v3-prog-bar" />
      <style precedence="default">{`
        .v3-prog {
          position: fixed; top: 0; left: 0; right: 0; height: 3px;
          z-index: 200; background: transparent; pointer-events: none;
        }
        .v3-prog-bar {
          height: 100%; transform: scaleX(0); transform-origin: 0 50%;
          background: linear-gradient(90deg,
            var(--v3-red), var(--v3-red-bright));
          box-shadow: 0 0 12px rgba(228,17,31,.6);
        }
        @media (prefers-reduced-motion: reduce) { .v3-prog { display: none; } }
      `}</style>
    </div>
  );
}
