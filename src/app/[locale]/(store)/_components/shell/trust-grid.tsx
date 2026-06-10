"use client";

import { useEffect, useRef, useState } from "react";
import { decideDraw } from "../../_lib/trust-draw";
import { TRUST_ICONS, type TrustIconKey } from "./trust-icons";

export interface TrustItem {
  key: TrustIconKey;
  title: string;
  line: string;
}

/* Trust grid with one-shot stroke-draw icons. The grid is server-rendered fully
   visible (no layout shift); this client wrapper only toggles `is-drawn` once
   the grid scrolls into view, which CSS turns into the stroke-draw. Under
   reduced motion (or no IntersectionObserver) it draws instantly on mount. */
export function TrustGrid({ items }: { items: TrustItem[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const [drawn, setDrawn] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    if (
      decideDraw({
        isIntersecting: false,
        hasDrawn: false,
        prefersReducedMotion,
      }) === "instant" ||
      typeof IntersectionObserver === "undefined"
    ) {
      // Defer out of the effect body to avoid a synchronous cascading render.
      const frame = requestAnimationFrame(() => setDrawn(true));
      return () => cancelAnimationFrame(frame);
    }

    const io = new IntersectionObserver(
      (entries) => {
        const decision = decideDraw({
          isIntersecting: entries[0]?.isIntersecting ?? false,
          hasDrawn: false,
          prefersReducedMotion,
        });
        if (decision === "animate") {
          setDrawn(true);
          io.disconnect();
        }
      },
      { rootMargin: "0px 0px -10% 0px", threshold: 0.2 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div ref={ref} className={`v3-trust-grid${drawn ? " is-drawn" : ""}`}>
      {items.map(({ key, title, line }) => (
        <div key={key} className="v3-trust-cell">
          {TRUST_ICONS[key]}
          <h3>{title}</h3>
          <p>{line}</p>
        </div>
      ))}
    </div>
  );
}
