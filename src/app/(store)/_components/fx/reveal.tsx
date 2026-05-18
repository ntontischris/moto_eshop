"use client";

import { useEffect, useRef, useState } from "react";

/* Reveal — one-shot fade/translate on scroll-in via IntersectionObserver.
   CWV-safe: animates only opacity/transform (compositor), passive observer,
   disconnects after firing. Respects reduced-motion. Content stays in flow
   (no layout shift) and is shown if JS/observer unavailable. */

export function Reveal({
  children,
  delay = 0,
}: {
  children: React.ReactNode;
  delay?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (
      typeof IntersectionObserver === "undefined" ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      setShown(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setShown(true);
          io.disconnect();
        }
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.08 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`v3-reveal${shown ? " is-in" : ""}`}
      style={{ transitionDelay: delay ? `${delay}ms` : undefined }}
    >
      {children}
      <noscript>
        <style>{`.v3-reveal{opacity:1;transform:none;}`}</style>
      </noscript>
    </div>
  );
}
