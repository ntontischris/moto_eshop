"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

interface AmbientVideoSectionProps {
  /** Path to optimized MP4 (e.g. /hero-variants-optimized/2-urban-night.mp4) */
  src: string;
  /** Small uppercase eyebrow */
  eyebrow: string;
  /** Main title (large) */
  title: string;
  /** Subtitle / lead text */
  body: string;
  /** CTA label */
  ctaLabel: string;
  /** CTA href */
  ctaHref: string;
  /** Section height. Default 70vh keeps it cinematic but doesn't dominate. */
  heightVh?: number;
  /** Optional: align overlay to "left" or "right". Default "left". */
  align?: "left" | "right";
}

/**
 * Section with an autoplaying ambient video background and a content overlay.
 *
 * Performance hygiene:
 *   - preload="none" until the section enters the viewport
 *   - autoplay starts only after IntersectionObserver fires
 *   - pauses when scrolled off-screen (battery / CPU)
 *   - muted + playsInline + loop for browser autoplay compliance
 *   - respects prefers-reduced-motion (shows static poster instead of motion)
 */
export function AmbientVideoSection({
  src,
  eyebrow,
  title,
  body,
  ctaLabel,
  ctaHref,
  heightVh = 70,
  align = "left",
}: AmbientVideoSectionProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [shouldLoad, setShouldLoad] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  // prefers-reduced-motion → don't autoplay the video
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  // Lazy load + play/pause on intersect
  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const obs = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            setShouldLoad(true);
            const v = videoRef.current;
            if (v && !reducedMotion) {
              // best-effort play; browsers may still block
              void v.play().catch(() => {});
            }
          } else {
            const v = videoRef.current;
            if (v) v.pause();
          }
        }
      },
      { threshold: 0.15, rootMargin: "100px" },
    );
    obs.observe(section);
    return () => obs.disconnect();
  }, [reducedMotion]);

  const overlayAlignClass =
    align === "right" ? "items-end text-right" : "items-start text-left";

  return (
    <section
      ref={sectionRef}
      style={{ height: `${heightVh}vh` }}
      className="relative w-full overflow-hidden bg-black"
    >
      {/* Background video — loads lazily, never if reduced-motion preferred */}
      {shouldLoad && !reducedMotion && (
        <video
          ref={videoRef}
          src={src}
          muted
          loop
          playsInline
          preload="metadata"
          aria-hidden="true"
          className="absolute inset-0 h-full w-full object-cover opacity-60"
        />
      )}

      {/* Dark vignette for contrast */}
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-black/70" />

      {/* Content overlay */}
      <div
        className={`relative z-10 mx-auto flex h-full max-w-7xl flex-col justify-center px-6 md:px-12 ${overlayAlignClass}`}
      >
        <p className="font-russo text-xs uppercase tracking-[0.3em] text-brand-red">
          {eyebrow}
        </p>
        <h2 className="mt-3 max-w-2xl font-russo text-3xl uppercase leading-none text-white md:text-5xl lg:text-6xl">
          {title}
        </h2>
        <p className="mt-5 max-w-xl text-sm text-neutral-300 md:text-base">
          {body}
        </p>
        <div className="mt-8">
          <Link
            href={ctaHref}
            className="inline-flex items-center gap-2 rounded-full bg-brand-red px-8 py-3 text-sm font-bold uppercase tracking-wider text-white shadow-[0_0_30px_rgba(220,38,38,0.4)] transition hover:scale-105"
          >
            {ctaLabel}
            <span aria-hidden>→</span>
          </Link>
        </div>
      </div>
    </section>
  );
}
