"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import {
  frameIndexForProgress,
  opacityForRange,
} from "@/lib/hero/scroll-progress";
import { useFrameLoader } from "./use-frame-loader";

export interface UnifiedScrollVideoCta {
  label: string;
  href: string;
  variant?: "primary" | "ghost";
}

export interface UnifiedScrollVideoBeat {
  /** Progress range [start, end] within the section (0..1). */
  range: [number, number];
  /** Layout slot for this beat's text. */
  position: "center" | "left" | "right";
  eyebrow: string;
  title: ReactNode;
  body: string;
  ctas: UnifiedScrollVideoCta[];
}

interface UnifiedScrollVideoProps {
  framesPath: string;
  frameCount: number;
  scrollHeightVh?: number;
  beats: UnifiedScrollVideoBeat[];
}

const FADE = 0.04;

function framePath(folder: string, i: number): string {
  return `${folder}/${String(i).padStart(4, "0")}.webp`;
}

function beatOpacity(progress: number, [start, end]: [number, number]): number {
  const fadeIn = opacityForRange(progress, start, start + FADE);
  const fadeOut = 1 - opacityForRange(progress, end - FADE, end);
  return fadeIn * fadeOut;
}

export function UnifiedScrollVideo({
  framesPath,
  frameCount,
  scrollHeightVh = 1500,
  beats,
}: UnifiedScrollVideoProps) {
  const sectionRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [progress, setProgress] = useState(0);
  const [reducedMotion, setReducedMotion] = useState(false);

  const { frames } = useFrameLoader({
    count: frameCount,
    urlFor: (i) => framePath(framesPath, i),
    observeRef: sectionRef,
  });

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  useEffect(() => {
    if (reducedMotion) {
      setProgress(0.5);
      return;
    }
    function update() {
      const el = sectionRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const total = rect.height - window.innerHeight;
      const consumed = -rect.top;
      const p = total > 0 ? consumed / total : 0;
      setProgress(p);
    }
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [reducedMotion]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const idx = frameIndexForProgress(progress, frameCount);
    let img = frames[idx];
    if (!img) {
      for (let i = idx - 1; i >= 0; i--) {
        if (frames[i]) {
          img = frames[i];
          break;
        }
      }
    }
    if (!img) img = frames[0];
    if (!img) return;
    if (
      canvas.width !== img.naturalWidth ||
      canvas.height !== img.naturalHeight
    ) {
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
    }
    ctx.drawImage(img, 0, 0);
  }, [progress, frames, frameCount]);

  function jumpToBeat(index: number) {
    const el = sectionRef.current;
    if (!el) return;
    const beat = beats[index];
    if (!beat) return;
    const mid = (beat.range[0] + beat.range[1]) / 2;
    const total = el.scrollHeight - window.innerHeight;
    const top = el.offsetTop + mid * total;
    window.scrollTo({ top, behavior: "smooth" });
  }

  const activeBeatIndex = beats.findIndex(
    (b) => progress >= b.range[0] && progress <= b.range[1],
  );

  return (
    <section
      ref={sectionRef}
      style={{ height: `${scrollHeightVh}vh`, position: "relative" }}
      className="bg-black"
    >
      <div className="sticky top-0 h-[100dvh] w-full overflow-hidden">
        {/* Full-bleed cinematic video — covers the entire viewport */}
        <img
          src={framePath(framesPath, 0)}
          alt=""
          aria-hidden="true"
          width={1280}
          height={720}
          fetchPriority="high"
          decoding="sync"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <canvas
          ref={canvasRef}
          className="absolute inset-0 h-full w-full object-cover"
          aria-hidden="true"
        />
        {/* Vignette gradients so overlay text stays legible regardless of frame */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-black/70 via-black/10 to-black/70" />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/60" />

        {/* Beat panels — full overlay slots aligned via position */}
        {beats.map((beat, i) => {
          const op = beatOpacity(progress, beat.range);
          if (op < 0.01) return null;
          const isLeft = beat.position === "left";
          const isRight = beat.position === "right";

          const slotAlign = isLeft
            ? "items-center justify-center md:items-center md:justify-start md:pl-12 lg:pl-20"
            : isRight
              ? "items-center justify-center md:items-center md:justify-end md:pr-12 lg:pr-20"
              : "items-center justify-center";

          const textAlign = isLeft
            ? "text-center md:text-left md:items-start"
            : isRight
              ? "text-center md:text-right md:items-end"
              : "text-center items-center";

          return (
            <div
              key={i}
              className={`pointer-events-none absolute inset-0 z-10 flex h-full w-full px-6 ${slotAlign}`}
              style={{ opacity: op, transition: "opacity 120ms linear" }}
            >
              <div
                className={`pointer-events-auto flex max-w-md flex-col gap-4 md:max-w-lg ${textAlign}`}
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
                      key={cta.href}
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
            </div>
          );
        })}

        {/* Navigation dots */}
        <div className="absolute bottom-6 left-1/2 z-20 flex -translate-x-1/2 items-center gap-3 rounded-full bg-black/40 px-4 py-2 backdrop-blur-sm">
          {beats.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => jumpToBeat(i)}
              aria-label={`Πήγαινε στο σημείο ${i + 1}`}
              className={`h-2 rounded-full transition-all ${
                activeBeatIndex === i
                  ? "w-8 bg-brand-red"
                  : "w-2 bg-white/40 hover:bg-white/70"
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
