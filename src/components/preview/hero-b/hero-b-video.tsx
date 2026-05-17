"use client";

import { useEffect, useRef } from "react";

/**
 * Architecture B: full-bleed baked video. The <video> element is the entire hero —
 * all text, eyebrows, vignettes, and beat transitions are pre-rendered into the
 * MP4 via ffmpeg. The page renders only this element + absolutely-positioned CTAs.
 *
 * Honors prefers-reduced-motion: pauses on first frame instead of looping.
 */
export function HeroBVideo() {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (mq.matches) {
      v.pause();
      v.currentTime = 0;
    }
  }, []);

  return (
    <video
      ref={videoRef}
      className="absolute inset-0 h-full w-full object-cover"
      autoPlay
      muted
      loop
      playsInline
      preload="auto"
      poster="/hero-variants/cinematic-hero-baked.mp4#t=0.1"
    >
      <source
        src="/hero-variants/cinematic-hero-baked-720p.mp4"
        type="video/mp4"
        media="(max-width: 768px)"
      />
      <source src="/hero-variants/cinematic-hero-baked.mp4" type="video/mp4" />
    </video>
  );
}
