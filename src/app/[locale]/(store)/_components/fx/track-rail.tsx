"use client";

import { useEffect, useRef } from "react";
import {
  NEUTRAL_GEAR,
  activeSectionIndex,
  gearForSection,
  scrollProgress,
} from "../../_lib/hud";

/* TrackRail — desktop-only HUD chrome (>=1100px via CSS). A fixed vertical
   "track" whose red fill tracks overall scroll progress, plus a gear indicator
   that shifts 1→6 as the visitor crosses each homepage section, with a brief
   "shift blip". Decorative: aria-hidden, and the whole thing is hidden on
   mobile and under reduced-motion. CWV-safe: one passive rAF-throttled scroll
   listener mutating only transform/opacity. */

const ACTIVATION_RATIO = 0.55; // section "owns" the rail once its top passes 55% down the viewport
const SECTION_SELECTOR = ".v3-home-reconstruction > *";

export function TrackRail({ gearLabel }: { gearLabel: string }) {
  const fillRef = useRef<HTMLSpanElement>(null);
  const gearRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (
      typeof window === "undefined" ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
      !window.matchMedia("(min-width: 1100px)").matches
    ) {
      return;
    }

    const fill = fillRef.current;
    const gear = gearRef.current;
    if (!fill || !gear) return;

    const sections = Array.from(
      document.querySelectorAll<HTMLElement>(SECTION_SELECTOR),
    );
    if (sections.length === 0) return;

    let currentGear = NEUTRAL_GEAR;
    let raf = 0;

    const blip = () => {
      gear.classList.remove("is-shift");
      // reflow so the animation restarts on every shift
      void gear.offsetWidth;
      gear.classList.add("is-shift");
    };

    const update = () => {
      raf = 0;
      const viewportHeight = window.innerHeight;
      const progress = scrollProgress(
        window.scrollY,
        document.documentElement.scrollHeight,
        viewportHeight,
      );
      fill.style.transform = `scaleY(${progress})`;

      const scrollLine = window.scrollY + viewportHeight * ACTIVATION_RATIO;
      const tops = sections.map((s) => s.offsetTop);
      const nextGear = gearForSection(activeSectionIndex(tops, scrollLine));
      if (nextGear !== currentGear) {
        currentGear = nextGear;
        gear.textContent = nextGear;
        blip();
      }
    };

    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(update);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    update();

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <aside className="v3-rail" aria-hidden="true">
      <span className="v3-rail-sector">Pit out</span>
      <span className="v3-rail-track">
        <span ref={fillRef} className="v3-rail-fill" />
        <s className="v3-rail-tick" />
        <s className="v3-rail-tick" />
      </span>
      <span className="v3-rail-gear">
        <em>{gearLabel}</em>
        <span ref={gearRef} className="v3-rail-gear-n">
          {NEUTRAL_GEAR}
        </span>
      </span>
    </aside>
  );
}
