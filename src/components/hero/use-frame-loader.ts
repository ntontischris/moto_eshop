"use client";

import { useEffect, useRef, useState } from "react";

interface Options {
  /** Total frame count, e.g. 120 */
  count: number;
  /** Frame URL builder, e.g. (i) => `/hero-frames/${pad(i)}.webp` */
  urlFor: (index: number) => string;
  /** Start preload only when this ref's element scrolls into view */
  observeRef?: React.RefObject<HTMLElement | null>;
}

/**
 * Preloads scroll-driven frames. Strategy: when the section enters view
 * (or rootMargin reaches it), kick off ALL frames in parallel. The browser
 * caps concurrent connections (~6 per origin under HTTP/1.1, more on H2/H3),
 * so fanning out everything lets the browser keep its pipe saturated and
 * avoids the "scroll outruns the loader" stutter where idle-batched frames
 * lag behind the user's scroll position.
 *
 * Returns { frames, loadedCount, started } where frames[i] is the
 * HTMLImageElement (or null until loaded). Components draw via
 * frames[i] if non-null, falling back to the nearest loaded frame.
 */
export function useFrameLoader({ count, urlFor, observeRef }: Options) {
  const framesRef = useRef<(HTMLImageElement | null)[]>(
    new Array(count).fill(null),
  );
  const [loadedCount, setLoadedCount] = useState(0);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    if (!observeRef?.current) {
      setStarted(true);
      return;
    }
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setStarted(true);
          obs.disconnect();
        }
      },
      { rootMargin: "400px" },
    );
    obs.observe(observeRef.current);
    return () => obs.disconnect();
  }, [observeRef]);

  useEffect(() => {
    if (!started) return;

    function loadOne(i: number) {
      const img = new Image();
      img.decoding = "async";
      // Lower priority on non-first frames so they download in parallel
      // without competing with the LCP image, fonts, JS, or CSS.
      img.fetchPriority = "low";
      img.onload = () => {
        framesRef.current[i] = img;
        setLoadedCount((n) => n + 1);
      };
      img.src = urlFor(i);
    }

    const first = new Image();
    first.decoding = "sync";
    first.fetchPriority = "high";
    first.onload = () => {
      framesRef.current[0] = first;
      setLoadedCount((n) => n + 1);
    };
    first.src = urlFor(0);

    for (let i = 1; i < count; i++) loadOne(i);
  }, [started, count, urlFor]);

  return { frames: framesRef.current, loadedCount, started };
}
