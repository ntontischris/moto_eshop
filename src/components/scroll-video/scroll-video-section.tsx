"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  frameIndexForProgress,
  opacityForRange,
} from "@/lib/hero/scroll-progress";
import { useFrameLoader } from "@/components/hero/use-frame-loader";

interface ScrollVideoSectionProps {
  /** Folder under /public, e.g. "/scroll-frames/coastal-sunset" */
  framesPath: string;
  /** Number of WebP frames in that folder (0000..NNNN). */
  frameCount: number;
  /** Total scroll distance the section consumes. Default 150vh. */
  scrollHeightVh?: number;
  eyebrow: string;
  title: string;
  body: string;
  ctaLabel: string;
  ctaHref: string;
  /** Overlay alignment. Default "left". */
  align?: "left" | "right";
}

function framePath(folder: string, i: number): string {
  return `${folder}/${String(i).padStart(4, "0")}.webp`;
}

/**
 * Scroll-driven cinematic section. Sticky viewport blits WebP frames to a
 * canvas based on scroll progress, while the overlay copy fades in toward
 * the middle of the scroll and out toward the end.
 *
 * Performance hygiene:
 *   - frames are extracted from MP4 via `pnpm hero:frames <src> <out>`
 *   - useFrameLoader starts loading frames only when section is ~200px away
 *   - frame 0 ships as a regular <img> for instant first paint
 *   - canvas uses object-cover to preserve full frame (no side cropping)
 */
export function ScrollVideoSection({
  framesPath,
  frameCount,
  scrollHeightVh = 150,
  eyebrow,
  title,
  body,
  ctaLabel,
  ctaHref,
  align = "left",
}: ScrollVideoSectionProps) {
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

  // Copy fades in 0.10 → 0.30 and out 0.75 → 0.95
  const copyOpacity =
    opacityForRange(progress, 0.1, 0.3) *
    (1 - opacityForRange(progress, 0.75, 0.95));

  const overlayAlignClass =
    align === "right" ? "items-end text-right" : "items-start text-left";

  return (
    <section
      ref={sectionRef}
      style={{ height: `${scrollHeightVh}vh`, position: "relative" }}
      className="bg-black"
    >
      <div className="sticky top-0 h-screen w-full overflow-hidden">
        <img
          src={framePath(framesPath, 0)}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <canvas
          ref={canvasRef}
          className="absolute inset-0 h-full w-full object-cover"
          aria-hidden="true"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-black/60" />
        <div
          className={`relative z-10 mx-auto flex h-full max-w-7xl flex-col justify-center px-6 md:px-12 ${overlayAlignClass}`}
          style={{ opacity: copyOpacity, transition: "opacity 120ms linear" }}
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
      </div>
    </section>
  );
}
