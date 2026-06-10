"use client";

import { useEffect, useRef, useState } from "react";
import type { gsap as Gsap } from "gsap";
import { useTranslations } from "next-intl";
import {
  hasSeenPreloader,
  markPreloaderSeen,
  shouldRunPreloader,
  speedometerReading,
} from "../../_lib/preloader";

/* SpeedometerPreloader — the S6 session-gated speedometer preloader.

   A pure overlay: the homepage (incl. the LCP hero poster) paints BEHIND it, so
   the overlay never sits on the LCP render path. On the first visit of a browser
   session it sweeps 000→299 km/h with a red bar (~1.0s), fades, then splits two
   gates apart to reveal the hero — total <= 1.2s. On every revisit, and entirely
   under prefers-reduced-motion, it renders nothing.

   GSAP is loaded lazily (already a dependency) so it stays off the initial
   bundle; if it fails to load the overlay just removes itself. */

const SWEEP_DURATION = 1.0;
const FADE_DURATION = 0.12;
const GATE_DURATION = 0.55;

export function SpeedometerPreloader() {
  const t = useTranslations("home");
  const [active, setActive] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const speedRef = useRef<HTMLSpanElement>(null);

  // Decide the gate after hydration so server and client agree (both render the
  // overlay markup); the effect then either runs it or removes it immediately.
  useEffect(() => {
    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const seen = hasSeenPreloader(window.sessionStorage);
    if (!shouldRunPreloader(seen, reduced)) {
      setActive(false);
      return;
    }
    markPreloaderSeen(window.sessionStorage);
    setActive(true);
  }, []);

  useEffect(() => {
    if (!active) return;
    const root = rootRef.current;
    const speed = speedRef.current;
    if (!root || !speed) return;

    document.body.dataset.preloading = "1";
    let cancelled = false;
    let timeline: ReturnType<typeof Gsap.timeline> | undefined;

    const cleanup = () => {
      delete document.body.dataset.preloading;
      setActive(false);
    };

    import("gsap")
      .then(({ gsap }) => {
        if (cancelled) return;
        const counter = { progress: 0 };
        timeline = gsap.timeline({ onComplete: cleanup });
        timeline
          .to(counter, {
            progress: 1,
            duration: SWEEP_DURATION,
            ease: "power2.inOut",
            onUpdate: () => {
              speed.textContent = speedometerReading(counter.progress);
            },
          })
          .to(
            root.querySelector(".v3-preloader__fill"),
            { scaleX: 1, duration: SWEEP_DURATION, ease: "power2.inOut" },
            0,
          )
          .to(root.querySelector(".v3-preloader__face"), {
            opacity: 0,
            duration: FADE_DURATION,
          })
          .to(
            root.querySelector(".v3-preloader__gate--left"),
            { xPercent: -101, duration: GATE_DURATION, ease: "power4.inOut" },
            ">-0.02",
          )
          .to(
            root.querySelector(".v3-preloader__gate--right"),
            { xPercent: 101, duration: GATE_DURATION, ease: "power4.inOut" },
            "<",
          );
      })
      .catch(cleanup);

    return () => {
      cancelled = true;
      timeline?.kill();
      delete document.body.dataset.preloading;
    };
  }, [active]);

  if (!active) return null;

  return (
    <div ref={rootRef} className="v3-preloader" aria-hidden="true">
      <div className="v3-preloader__gate v3-preloader__gate--left" />
      <div className="v3-preloader__gate v3-preloader__gate--right" />
      <div className="v3-preloader__face">
        <div className="v3-preloader__speed">
          <span ref={speedRef}>000</span>
          <i>·</i>
        </div>
        <div className="v3-preloader__unit">{t("preloaderUnit")}</div>
        <div className="v3-preloader__bar">
          <span className="v3-preloader__fill" />
        </div>
      </div>
    </div>
  );
}
