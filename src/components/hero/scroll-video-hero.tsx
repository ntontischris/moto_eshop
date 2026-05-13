"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  frameIndexForProgress,
  opacityForRange,
} from "@/lib/hero/scroll-progress";
import { useFrameLoader } from "./use-frame-loader";

const FRAME_COUNT = 96;
const SCROLL_HEIGHT_VH = 200;

function frameUrl(i: number): string {
  const padded = String(i).padStart(4, "0");
  return `/hero-frames/${padded}.webp`;
}

export function ScrollVideoHero() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [progress, setProgress] = useState(0);
  const [reducedMotion, setReducedMotion] = useState(false);

  const { frames } = useFrameLoader({
    count: FRAME_COUNT,
    urlFor: frameUrl,
    observeRef: sectionRef,
  });

  // Detect prefers-reduced-motion (set static mid-frame)
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  // Scroll → progress
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

  // Draw current frame to canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const idx = frameIndexForProgress(progress, FRAME_COUNT);
    const img = frames[idx] ?? frames[0];
    if (!img) return;
    if (
      canvas.width !== img.naturalWidth ||
      canvas.height !== img.naturalHeight
    ) {
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
    }
    ctx.drawImage(img, 0, 0);
  }, [progress, frames]);

  // Text overlay is visible from page load and fades out toward the end of
  // the scroll, so the next section can take focus. The previous behavior
  // (fade in only after scrolling) left the user looking at a black canvas.
  const textFadeOut = 1 - opacityForRange(progress, 0.75, 0.95);

  return (
    <section
      ref={sectionRef}
      style={{ height: `${SCROLL_HEIGHT_VH}vh`, position: "relative" }}
      className="bg-black"
    >
      <div className="sticky top-0 h-screen w-full overflow-hidden">
        {/* Frame 0 as a regular <img> for instant first paint. Stays under
            the canvas; the canvas takes over once it has a real frame. */}
        <img
          src="/hero-frames/0000.webp"
          alt=""
          aria-hidden="true"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <canvas
          ref={canvasRef}
          className="absolute inset-0 h-full w-full object-cover"
          aria-hidden="true"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/70" />
        <div
          className="absolute inset-0 flex flex-col items-start justify-end p-8 md:p-16"
          style={{ opacity: textFadeOut, transition: "opacity 120ms linear" }}
        >
          <p className="font-russo text-xs tracking-[0.3em] text-brand-red">
            RACE-GRADE EQUIPMENT
          </p>
          <h1 className="mt-3 font-russo text-5xl uppercase leading-none text-white md:text-8xl xl:text-9xl">
            Ride. <br />
            <span className="text-brand-red">Protected.</span>
          </h1>
          <div className="mt-8 flex flex-wrap gap-4">
            <Link
              href="/eksoplismos-anabath"
              className="rounded-full bg-brand-red px-8 py-3 text-sm font-bold uppercase tracking-wider text-white shadow-[0_0_30px_rgba(220,38,38,0.5)] transition hover:scale-105"
            >
              Δες τον κατάλογο
            </Link>
            <Link
              href="/prosfores"
              className="rounded-full border border-white/30 px-8 py-3 text-sm font-bold uppercase tracking-wider text-white transition hover:bg-white/10"
            >
              Προσφορές
            </Link>
          </div>

          {/* Scroll hint — fades out as soon as user starts scrolling */}
          <p
            className="mt-10 text-xs uppercase tracking-widest text-white/60"
            style={{
              opacity: 1 - opacityForRange(progress, 0.02, 0.1),
              transition: "opacity 100ms linear",
            }}
          >
            ↓ Scroll
          </p>
        </div>
      </div>
    </section>
  );
}
