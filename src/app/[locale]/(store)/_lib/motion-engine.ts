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
import { applyCharSplit } from "./char-split";
import { shouldPinTunnel, tunnelScrollDistance } from "./gear-tunnel";
import { shouldAnimateReveal } from "./motion-engine-gate";
import { velocityToSkew, velocityToTimeScale } from "./motion";
import { applyWordSplit, editorialZoomScale } from "./word-split";

type Disposer = () => void;

const REVEAL_SELECTOR = "[data-reveal]";
const MARQUEE_SELECTORS = [".v3-proof-track", ".v3-bc-track"];

/* S7 hero cinematic entrance + scroll scrub. The hero text is visible from the
   first paint (CSS baseline), so this only enriches: it char-splits the title
   lines, plays a staggered entrance, and scrubs media parallax + per-line
   slide/fade on scroll. Only transform/opacity are touched. Returns a disposer
   that kills the timeline, the ScrollTriggers and clears all inline props so the
   static baseline is restored. */
function startHero(): Disposer {
  const hero = document.querySelector<HTMLElement>("[data-hero-entrance]");
  if (!hero) return () => {};

  const disposers: Disposer[] = [];

  const lines = gsap.utils.toArray<HTMLElement>("[data-hero-line]", hero);
  const splitTargets = gsap.utils.toArray<HTMLElement>("[data-split]", hero);
  const chars = splitTargets.flatMap((el) => applyCharSplit(el));
  const secondary = gsap.utils.toArray<HTMLElement>(
    "[data-hero-stagger]",
    hero,
  );

  const entrance = gsap.timeline({ paused: true });
  entrance
    .from(
      "[data-hero-media]",
      { scale: 1.16, duration: 1.5, ease: "power3.out" },
      0,
    )
    .from(
      chars,
      {
        yPercent: 120,
        rotate: 6,
        duration: 0.9,
        stagger: 0.022,
        ease: "power4.out",
      },
      0.05,
    )
    .from(
      secondary,
      { y: 24, opacity: 0, duration: 0.7, stagger: 0.07, ease: "power3.out" },
      0.55,
    );

  // Coordinate with the S6 preloader: while it runs it sets body[data-preloading]
  // and ends with a split-gate reveal, so we hold the entrance until that clears
  // and the gates have parted — otherwise the title would pop before the reveal.
  const playEntrance = () => {
    chars.forEach((c) => (c.style.willChange = "transform"));
    entrance.play();
  };
  disposers.push(whenPreloaderDone(playEntrance));

  // Scrubbed scroll exit: media parallaxes down while each title line slides
  // apart (odd lines one way, even the other) and fades. All transform/opacity.
  const parallax = gsap.to("[data-hero-media]", {
    yPercent: 14,
    scale: 1.08,
    ease: "none",
    scrollTrigger: {
      trigger: hero,
      start: "top top",
      end: "bottom top",
      scrub: true,
    },
  });
  disposers.push(() => parallax.scrollTrigger?.kill());

  lines.forEach((line, index) => {
    const tween = gsap.to(line, {
      xPercent: index % 2 ? -9 : 9,
      opacity: 0,
      ease: "none",
      scrollTrigger: {
        trigger: hero,
        start: "30% top",
        end: "bottom top",
        scrub: true,
      },
    });
    disposers.push(() => tween.scrollTrigger?.kill());
  });

  return () => {
    entrance.kill();
    disposers.forEach((d) => d());
    gsap.set([...chars, ...lines, ...secondary], { clearProps: "all" });
    gsap.set("[data-hero-media]", { clearProps: "transform" });
  };
}

/* Resolves when the preloader is no longer covering the hero: if body has no
   data-preloading flag we run on the next frame; otherwise we watch for the
   flag to be removed (the preloader deletes it as its gates part). Returns a
   disposer that detaches the observer / cancels the pending frame. */
function whenPreloaderDone(run: () => void): Disposer {
  if (!document.body.dataset.preloading) {
    const frame = requestAnimationFrame(run);
    return () => cancelAnimationFrame(frame);
  }
  const observer = new MutationObserver(() => {
    if (!document.body.dataset.preloading) {
      observer.disconnect();
      run();
    }
  });
  observer.observe(document.body, {
    attributes: true,
    attributeFilter: ["data-preloading"],
  });
  return () => observer.disconnect();
}

/* S9 Gear Tunnel — pinned horizontal category showcase. On wide, fine-pointer,
   motion-OK devices we pin the section and scrub the track sideways (the page's
   vertical scroll drives horizontal travel), parallax each card's masked image,
   and fill the progress bar. On narrow / touch / reduced-motion we do nothing —
   the CSS scroll-snap rail is the baseline. Only transform/scaleX are animated;
   the disposer kills the ScrollTriggers and clears all inline props so the
   static rail is restored with no layout jump. */
function startGearTunnel(): Disposer {
  const section = document.querySelector<HTMLElement>("[data-gear-tunnel]");
  const pin = section?.querySelector<HTMLElement>("[data-gear-tunnel-pin]");
  const track = section?.querySelector<HTMLElement>("[data-gear-tunnel-track]");
  if (!section || !pin || !track) return () => {};

  const fill = section.querySelector<HTMLElement>("[data-gear-tunnel-fill]");
  const masks = gsap.utils.toArray<HTMLElement>(
    "[data-gear-tunnel-mask] img",
    track,
  );

  const mode = {
    isWideViewport: window.matchMedia("(min-width: 900px)").matches,
    hasFinePointer: window.matchMedia("(pointer: fine)").matches,
    prefersReducedMotion: window.matchMedia("(prefers-reduced-motion: reduce)")
      .matches,
  };
  if (!shouldPinTunnel(mode)) return () => {};

  const distance = tunnelScrollDistance(track.scrollWidth, pin.clientWidth);
  if (distance <= 0) return () => {};

  const tween = gsap.to(track, {
    x: -distance,
    ease: "none",
    scrollTrigger: {
      trigger: section,
      pin,
      start: "top top",
      end: () => `+=${distance}`,
      scrub: 1,
      invalidateOnRefresh: true,
      anticipatePin: 1,
      onUpdate: (self) => {
        if (fill) gsap.set(fill, { scaleX: self.progress });
        masks.forEach((img) =>
          gsap.set(img, { xPercent: (0.5 - self.progress) * 12 }),
        );
      },
    },
  });

  return () => {
    tween.scrollTrigger?.kill();
    tween.kill();
    gsap.set([track, fill, ...masks].filter(Boolean), { clearProps: "all" });
  };
}

/* S12 editorial chapter — sticky cinematic scene. The chapter is taller than the
   viewport and its stage pins via CSS sticky; here we scrub the pit-lane media's
   zoom-out across the chapter's scroll (entry zoomed-in → rest), reveal the quote
   word-by-word on first entry, and lift the kicker / lead / CTA after it. The CSS
   baseline already shows everything at rest, so this only enriches; the disposer
   kills the ScrollTriggers and clears inline props so the static scene returns.
   Only transform/opacity are animated. */
function startEditorial(): Disposer {
  const chapter = document.querySelector<HTMLElement>(
    "[data-editorial-chapter]",
  );
  const media = chapter?.querySelector<HTMLElement>("[data-editorial-media]");
  const quote = chapter?.querySelector<HTMLElement>("[data-editorial-quote]");
  if (!chapter || !media || !quote) return () => {};

  const disposers: Disposer[] = [];
  const leads = gsap.utils.toArray<HTMLElement>(
    "[data-editorial-lead]",
    chapter,
  );
  const words = applyWordSplit(quote);

  // Scrubbed media zoom-out tied to the whole chapter's scroll progress.
  const zoom = gsap.to(media, {
    ease: "none",
    scrollTrigger: {
      trigger: chapter,
      start: "top bottom",
      end: "bottom top",
      scrub: true,
      onUpdate: (self) =>
        gsap.set(media, { scale: editorialZoomScale(self.progress) }),
    },
  });
  disposers.push(() => zoom.scrollTrigger?.kill());

  // Word-by-word quote reveal + kicker/lead/CTA follow, once on first entry.
  const reveal = gsap.timeline({
    paused: true,
    scrollTrigger: { trigger: chapter, start: "top 55%", once: true },
  });
  reveal
    .from(words, {
      yPercent: 110,
      duration: 0.9,
      stagger: 0.05,
      ease: "power4.out",
    })
    .from(
      leads,
      { y: 22, opacity: 0, duration: 0.7, stagger: 0.12, ease: "power3.out" },
      0.2,
    );
  disposers.push(() => reveal.scrollTrigger?.kill());

  return () => {
    zoom.kill();
    reveal.kill();
    disposers.forEach((d) => d());
    gsap.set([media, ...words, ...leads], { clearProps: "all" });
  };
}

/* S13 offers backdrop — the giant outlined "ΠΡΟΣΦΟΡΕΣ" wordmark behind the deal
   cards drifts sideways as the offers section scrolls past. Pure transform,
   scrubbed; the disposer kills the trigger and clears the inline transform so
   the static (centered) baseline returns. No-op when the element is absent. */
function startOffersDrift(): Disposer {
  const backdrop = document.querySelector<HTMLElement>("[data-offers-drift]");
  const section = backdrop?.closest<HTMLElement>(".v3-off");
  if (!backdrop || !section) return () => {};

  const tween = gsap.fromTo(
    backdrop,
    { xPercent: 4 },
    {
      xPercent: -14,
      ease: "none",
      scrollTrigger: {
        trigger: section,
        start: "top bottom",
        end: "bottom top",
        scrub: true,
      },
    },
  );

  return () => {
    tween.scrollTrigger?.kill();
    tween.kill();
    gsap.set(backdrop, { clearProps: "transform" });
  };
}

export function start(): Disposer {
  gsap.registerPlugin(ScrollTrigger);
  const disposers: Disposer[] = [];

  disposers.push(startHero());
  disposers.push(startGearTunnel());
  disposers.push(startEditorial());
  disposers.push(startOffersDrift());

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
  // Groups already in the viewport at engine start (above the fold) keep their
  // painted CSS baseline: animating them post-hydration shifted layout (CLS).
  gsap.utils.toArray<HTMLElement>(REVEAL_SELECTOR).forEach((group) => {
    if (!shouldAnimateReveal(ScrollTrigger.isInViewport(group))) return;
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
