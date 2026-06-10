/* Velocità motion engine — the heavy half of the motion foundation.
   Loaded ONLY via dynamic import after hydration (see motion-provider.tsx),
   so none of GSAP/ScrollTrigger/Lenis ships in the server payload or the
   initial client bundle. Caller guarantees motion is allowed (reduced-motion
   already filtered out) before invoking start().

   Contract: only transform/opacity are animated. Returns a disposer that fully
   tears down ScrollTriggers, the Lenis instance and the gsap ticker hook. */

import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
import { velocityToSkew, velocityToTimeScale } from "./motion";

type Disposer = () => void;

const REVEAL_SELECTOR = "[data-reveal]";
const MARQUEE_SELECTORS = [".v3-proof-track", ".v3-bc-track"];

export function start(): Disposer {
  gsap.registerPlugin(ScrollTrigger);
  const disposers: Disposer[] = [];

  // Lenis smooth scroll on fine-pointer devices only; touch keeps native
  // scroll (PRD). gsap.ticker drives the rAF loop and feeds ScrollTrigger.
  const fine = window.matchMedia("(pointer: fine)").matches;
  if (fine) {
    const lenis = new Lenis({ lerp: 0.1 });
    lenis.on("scroll", ScrollTrigger.update);
    const tick = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);
    disposers.push(() => {
      gsap.ticker.remove(tick);
      lenis.destroy();
    });
  }

  // Staggered scroll reveals. Each [data-reveal] group fades + lifts its
  // direct children in sequence as it scrolls into view. The Intersection
  // observer baseline already made content visible, so this only enriches —
  // clearProps drops the inline styles afterwards (no layout props touched).
  gsap.utils.toArray<HTMLElement>(REVEAL_SELECTOR).forEach((group) => {
    const targets = group.children.length ? group.children : group;
    const tween = gsap.from(targets, {
      opacity: 0,
      yPercent: 12,
      duration: 0.7,
      ease: "power3.out",
      stagger: 0.08,
      clearProps: "opacity,transform",
      scrollTrigger: { trigger: group, start: "top 85%", once: true },
    });
    disposers.push(() => tween.scrollTrigger?.kill());
  });

  // Velocity-reactive marquees: the CSS keyframe loop is the no-JS / reduced-
  // motion baseline; here we pause it and drive the track with a GSAP loop so
  // its timeScale + skew can react to scroll velocity (skew + accelerate).
  MARQUEE_SELECTORS.forEach((selector) => {
    const track = document.querySelector<HTMLElement>(selector);
    if (!track) return;

    const prevAnimation = track.style.animation;
    track.style.animation = "none";

    const loop = gsap.to(track, {
      xPercent: -50,
      duration: 24,
      ease: "none",
      repeat: -1,
    });

    const proxy = { skew: 0 };
    const st = ScrollTrigger.create({
      onUpdate: (self) => {
        const v = self.getVelocity();
        gsap.to(proxy, {
          skew: velocityToSkew(v),
          duration: 0.4,
          overwrite: true,
          onUpdate: () => gsap.set(track, { skewX: proxy.skew }),
        });
        loop.timeScale(velocityToTimeScale(v));
      },
    });

    disposers.push(() => {
      st.kill();
      loop.kill();
      gsap.set(track, { clearProps: "transform" });
      track.style.animation = prevAnimation;
    });
  });

  ScrollTrigger.refresh();

  return () => {
    disposers.forEach((d) => d());
  };
}
