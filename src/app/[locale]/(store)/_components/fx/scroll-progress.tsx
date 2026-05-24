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
    </div>
  );
}
