"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";

/* HeritageStrip — count-up stats on scroll-in. CWV-safe: one Intersection
   observer, rAF count, transform/opacity only. Reduced-motion → final value
   immediately. */

function useCountUp(target: number | null, run: boolean) {
  const [v, setV] = useState(0);
  useEffect(() => {
    if (target == null || !run) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      // Intentional one-time set: reduced-motion users get the final value
      // immediately. Fires once per effect run, not a cascading render.
      // eslint-disable-next-line react-hooks/set-state-in-effect
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

interface StatDef {
  to: number | null;
  render: (n: number) => string;
  labelKey: string;
  valueKey?: string;
}

function Stat({
  stat,
  run,
  label,
  value,
}: {
  stat: StatDef;
  run: boolean;
  label: string;
  value?: string;
}) {
  const v = useCountUp(stat.to, run);
  return (
    <div className="v3-hs-cell">
      <span className="v3-hs-value v3-display">
        {stat.to == null ? (value ?? stat.render(0)) : stat.render(v)}
      </span>
      <span className="v3-hs-label">{label}</span>
    </div>
  );
}

const STAT_DEFS: StatDef[] = [
  {
    to: 11000,
    render: (n) => `${Math.round(n).toLocaleString("el-GR")}+`,
    labelKey: "heritageProducts",
  },
  {
    to: null,
    render: () => "",
    labelKey: "heritageSuppliersLabel",
    valueKey: "heritageSuppliers",
  },
  {
    to: 3,
    render: (n) => `1–${Math.round(n)}`,
    labelKey: "heritageDelivery",
  },
  {
    to: 14,
    render: (n) => `${Math.round(n)}`,
    labelKey: "heritageReturn",
  },
];

export function HeritageStrip() {
  const t = useTranslations("home");
  const ref = useRef<HTMLElement>(null);
  const [run, setRun] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") {
      // Client-only fallback when IntersectionObserver is unavailable: start the
      // count-up immediately. Fires once on mount and only client-side, so it
      // cannot cascade or cause a hydration mismatch (server renders run=false).
      // eslint-disable-next-line react-hooks/set-state-in-effect
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
    <section ref={ref} className="v3-hs" aria-label={t("heritageNumbers")}>
      <div className="v3-hs-inner">
        {STAT_DEFS.map((s) => (
          <Stat
            key={s.labelKey}
            stat={s}
            run={run}
            label={t(s.labelKey)}
            value={s.valueKey ? t(s.valueKey) : undefined}
          />
        ))}
      </div>
    </section>
  );
}
