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
    </section>
  );
}
