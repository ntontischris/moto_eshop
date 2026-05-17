"use client";

import { useEffect, useRef, useState } from "react";

/* HeritageStrip — count-up stats on scroll-in. CWV-safe: one Intersection
   observer, rAF count, transform/opacity only. Reduced-motion → final value
   immediately. */

const STATS: {
  to: number | null;
  render: (n: number) => string;
  label: string;
}[] = [
  {
    to: 11000,
    render: (n) => `${Math.round(n).toLocaleString("el-GR")}+`,
    label: "προϊόντα στο κατάστημα",
  },
  { to: null, render: () => "Επίσημοι", label: "προμηθευτές & brands" },
  { to: 3, render: (n) => `1–${Math.round(n)}`, label: "εργάσιμες παράδοση" },
  {
    to: 14,
    render: (n) => `${Math.round(n)}`,
    label: "ημέρες αλλαγή μεγέθους",
  },
];

function useCountUp(target: number | null, run: boolean) {
  const [v, setV] = useState(0);
  useEffect(() => {
    if (target == null || !run) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setV(target);
      return;
    }
    let raf = 0;
    const t0 = performance.now();
    const dur = 1400;
    const tick = (now: number) => {
      const p = Math.min(1, (now - t0) / dur);
      const eased = 1 - Math.pow(1 - p, 3);
      setV(target * eased);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, run]);
  return v;
}

function Stat({ stat, run }: { stat: (typeof STATS)[number]; run: boolean }) {
  const v = useCountUp(stat.to, run);
  return (
    <div className="v3-hs-cell">
      <span className="v3-hs-value v3-display">
        {stat.to == null ? stat.render(0) : stat.render(v)}
      </span>
      <span className="v3-hs-label">{stat.label}</span>
    </div>
  );
}

export function HeritageStrip() {
  const ref = useRef<HTMLElement>(null);
  const [run, setRun] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") {
      setRun(true);
      return;
    }
    const io = new IntersectionObserver(
      (e) => {
        if (e[0]?.isIntersecting) {
          setRun(true);
          io.disconnect();
        }
      },
      { threshold: 0.3 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <section ref={ref} className="v3-hs" aria-label="MotoMarket με αριθμούς">
      <div className="v3-hs-inner">
        {STATS.map((s) => (
          <Stat key={s.label} stat={s} run={run} />
        ))}
      </div>
      <style precedence="default">{`
        .v3-hs {
          padding: clamp(56px, 8vw, 96px) var(--v3-gutter);
          background: var(--v3-carbon);
          border-top: 1px solid var(--v3-line);
        }
        .v3-hs-inner {
          max-width: 1180px; margin: 0 auto; display: grid;
          grid-template-columns: repeat(4, 1fr); gap: 16px; text-align: center;
        }
        .v3-hs-cell {
          display: flex; flex-direction: column; gap: 8px;
          padding: 18px; border-right: 1px solid var(--v3-line);
        }
        .v3-hs-cell:last-child { border-right: 0; }
        .v3-hs-value {
          font-size: clamp(2rem, 5vw, 3.6rem); font-weight: 900;
          color: var(--v3-bone); transform: skewX(-6deg);
          font-variant-numeric: tabular-nums;
        }
        .v3-hs-label { font-size: .82rem; color: var(--v3-bone-dim);
          letter-spacing: .03em; }
        @media (max-width: 720px) {
          .v3-hs-inner { grid-template-columns: repeat(2, 1fr); }
          .v3-hs-cell:nth-child(2) { border-right: 0; }
        }
      `}</style>
    </section>
  );
}
