"use client";

import Link from "next/link";
import { Fragment } from "react";
import { beatOpacity, type HeroCBeat } from "./beats";

interface PanelsProps {
  beats: HeroCBeat[];
  progress: number;
  reducedMotion: boolean;
  isMobile: boolean;
}

function positionClasses(
  position: HeroCBeat["position"],
  isMobile: boolean,
): string {
  if (isMobile) {
    return "items-center justify-center text-center";
  }
  switch (position) {
    case "left":
      return "items-center justify-start text-left pl-[8vw]";
    case "right":
      return "items-center justify-end text-right pr-[8vw]";
    case "center":
    default:
      return "items-center justify-center text-center";
  }
}

function ctaClasses(variant: "primary" | "ghost" | undefined): string {
  if (variant === "ghost") {
    return "inline-flex items-center justify-center rounded-md border border-white/40 bg-white/5 px-5 py-3 text-sm font-semibold uppercase tracking-wider text-white backdrop-blur-sm transition hover:border-white/70 hover:bg-white/10";
  }
  return "inline-flex items-center justify-center rounded-md bg-brand-red px-5 py-3 text-sm font-semibold uppercase tracking-wider text-white shadow-[0_0_30px_rgba(220,38,38,0.45)] transition hover:bg-brand-red-hover";
}

export function HeroCPanels({
  beats,
  progress,
  reducedMotion,
  isMobile,
}: PanelsProps) {
  return (
    <div className="pointer-events-none absolute inset-0 z-20">
      {beats.map((beat, i) => {
        const opacity = reducedMotion
          ? i === 0
            ? 1
            : 0
          : beatOpacity(progress, beat.range);
        const visible = opacity > 0.01;
        return (
          <div
            key={i}
            aria-hidden={!visible}
            style={{
              opacity,
              transform: `translateY(${(1 - opacity) * 12}px)`,
              transition: reducedMotion ? "none" : "transform 120ms linear",
            }}
            className={`absolute inset-0 flex px-6 ${positionClasses(beat.position, isMobile)}`}
          >
            <div
              className={`pointer-events-auto max-w-xl ${isMobile ? "" : beat.position === "right" ? "items-end" : beat.position === "left" ? "items-start" : ""}`}
              style={{ pointerEvents: visible ? "auto" : "none" }}
            >
              <p className="mb-3 text-xs font-semibold uppercase tracking-[0.35em] text-white/70 sm:text-sm">
                {beat.eyebrow}
              </p>
              <h2 className="font-display mb-5 text-4xl leading-[1.05] text-white drop-shadow-[0_2px_24px_rgba(0,0,0,0.7)] sm:text-5xl md:text-6xl lg:text-7xl">
                {beat.title}
              </h2>
              <p className="mb-7 max-w-prose text-sm leading-relaxed text-white/85 sm:text-base">
                {beat.body}
              </p>
              <div
                className={`flex flex-wrap gap-3 ${isMobile ? "justify-center" : beat.position === "right" ? "justify-end" : beat.position === "left" ? "justify-start" : "justify-center"}`}
              >
                {beat.ctas.map((cta, j) => (
                  <Fragment key={j}>
                    <Link href={cta.href} className={ctaClasses(cta.variant)}>
                      {cta.label}
                    </Link>
                  </Fragment>
                ))}
              </div>
            </div>
          </div>
        );
      })}

      {/* Vignette + bottom gradient for legibility */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/60" />
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at center, transparent 35%, rgba(0,0,0,0.55) 100%)",
        }}
      />

      {/* Scroll indicator (intro only) */}
      <div
        className="absolute bottom-6 left-1/2 -translate-x-1/2 text-[10px] uppercase tracking-[0.4em] text-white/60"
        style={{
          opacity: reducedMotion ? 0 : Math.max(0, 1 - progress * 6),
          transition: "opacity 200ms linear",
        }}
      >
        Scroll
      </div>
    </div>
  );
}
