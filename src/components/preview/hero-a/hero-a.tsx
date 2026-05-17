"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import type { Beat } from "./beats";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger, useGSAP);
}

interface HeroAProps {
  beats: Beat[];
  scrollHeightVh?: number;
}

function slotAlignClasses(position: Beat["position"]): string {
  if (position === "left") {
    return "items-center justify-center md:items-center md:justify-start md:pl-12 lg:pl-20";
  }
  if (position === "right") {
    return "items-center justify-center md:items-center md:justify-end md:pr-12 lg:pr-20";
  }
  return "items-center justify-center";
}

function textAlignClasses(position: Beat["position"]): string {
  if (position === "left") return "text-center md:text-left md:items-start";
  if (position === "right") return "text-center md:text-right md:items-end";
  return "text-center items-center";
}

export function HeroA({ beats, scrollHeightVh = 750 }: HeroAProps) {
  const sectionRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const panelRefs = useRef<Array<HTMLDivElement | null>>([]);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (reducedMotion) {
      video.pause();
    } else {
      const playPromise = video.play();
      if (playPromise && typeof playPromise.catch === "function") {
        playPromise.catch(() => {
          /* autoplay blocked — poster will remain visible */
        });
      }
    }
  }, [reducedMotion]);

  useGSAP(
    () => {
      if (reducedMotion) return;
      const section = sectionRef.current;
      if (!section) return;

      const ctx = gsap.context(() => {
        beats.forEach((beat, i) => {
          const el = panelRefs.current[i];
          if (!el) return;
          const [start, end] = beat.range;
          const FADE = 0.05;

          gsap.set(el, { opacity: 0, y: 32, willChange: "transform, opacity" });

          gsap
            .timeline({
              scrollTrigger: {
                trigger: section,
                start: "top top",
                end: "bottom bottom",
                scrub: 0.6,
              },
            })
            .to(el, { opacity: 0, y: 32, duration: start, ease: "none" })
            .to(el, { opacity: 1, y: 0, duration: FADE, ease: "power2.out" })
            .to(el, {
              opacity: 1,
              y: 0,
              duration: end - start - 2 * FADE,
              ease: "none",
            })
            .to(el, { opacity: 0, y: -24, duration: FADE, ease: "power2.in" })
            .to(el, { opacity: 0, duration: 1 - end, ease: "none" });
        });
      }, section);

      return () => ctx.revert();
    },
    { dependencies: [reducedMotion, beats], scope: sectionRef },
  );

  if (reducedMotion) {
    return (
      <section className="relative bg-black">
        <div className="relative h-[100dvh] w-full overflow-hidden">
          <video
            ref={videoRef}
            poster="/hero-variants/cinematic-hero-poster.jpg"
            muted
            playsInline
            preload="metadata"
            className="absolute inset-0 h-full w-full object-cover"
            aria-hidden="true"
          >
            <source
              src="/hero-variants/cinematic-hero-720p.mp4"
              media="(max-width: 768px)"
              type="video/mp4"
            />
            <source
              src="/hero-variants/cinematic-hero-1080p.mp4"
              type="video/mp4"
            />
          </video>
          <div className="pointer-events-none absolute inset-0 bg-black/55" />
        </div>
        <div className="mx-auto flex max-w-3xl flex-col gap-12 px-6 py-16">
          {beats.map((beat, i) => (
            <PanelContent key={i} beat={beat} position="center" />
          ))}
        </div>
      </section>
    );
  }

  return (
    <section
      ref={sectionRef}
      style={{ height: `${scrollHeightVh}vh` }}
      className="relative bg-black"
    >
      <div className="sticky top-0 h-[100dvh] w-full overflow-hidden">
        <video
          ref={videoRef}
          poster="/hero-variants/cinematic-hero-poster.jpg"
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          className="absolute inset-0 h-full w-full object-cover"
          aria-hidden="true"
        >
          <source
            src="/hero-variants/cinematic-hero-720p.mp4"
            media="(max-width: 768px)"
            type="video/mp4"
          />
          <source
            src="/hero-variants/cinematic-hero-1080p.mp4"
            type="video/mp4"
          />
        </video>

        {/* Dual side vignette so panel text stays legible regardless of frame */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-black/75 via-black/15 to-black/75" />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/35 via-transparent to-black/65" />

        {beats.map((beat, i) => (
          <div
            key={i}
            ref={(el) => {
              panelRefs.current[i] = el;
            }}
            className={`pointer-events-none absolute inset-0 z-10 flex h-full w-full px-6 ${slotAlignClasses(
              beat.position,
            )}`}
            style={{ opacity: 0 }}
          >
            <PanelContent beat={beat} position={beat.position} />
          </div>
        ))}
      </div>
    </section>
  );
}

interface PanelContentProps {
  beat: Beat;
  position: Beat["position"];
}

function PanelContent({ beat, position }: PanelContentProps) {
  return (
    <div
      className={`pointer-events-auto flex max-w-md flex-col gap-4 md:max-w-lg ${textAlignClasses(
        position,
      )}`}
    >
      <p className="font-russo text-xs uppercase tracking-[0.3em] text-brand-red">
        {beat.eyebrow}
      </p>
      <h2 className="font-russo text-3xl uppercase leading-none text-white md:text-5xl lg:text-6xl">
        {beat.title}
      </h2>
      <p className="max-w-md text-sm text-neutral-200 md:text-base">
        {beat.body}
      </p>
      <div className="mt-2 flex flex-wrap items-center justify-center gap-3 md:justify-start">
        {beat.ctas.map((cta) => (
          <Link
            key={cta.href + cta.label}
            href={cta.href}
            className={
              cta.variant === "ghost"
                ? "rounded-full border border-white/30 px-6 py-2.5 text-xs font-bold uppercase tracking-wider text-white transition hover:bg-white/10 md:px-8 md:py-3 md:text-sm"
                : "inline-flex items-center gap-2 rounded-full bg-brand-red px-6 py-2.5 text-xs font-bold uppercase tracking-wider text-white shadow-[0_0_30px_rgba(220,38,38,0.4)] transition hover:scale-105 md:px-8 md:py-3 md:text-sm"
            }
          >
            {cta.label}
            {cta.variant !== "ghost" && <span aria-hidden>→</span>}
          </Link>
        ))}
      </div>
    </div>
  );
}
