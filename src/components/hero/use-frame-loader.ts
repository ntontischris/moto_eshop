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
 * Preloads hero frames in three priority bands:
 *   1. Frame 0 inline (load immediately on mount)
 *   2. Frames 1-30 in parallel (high priority)
 *   3. Frames 31..end lazily via requestIdleCallback batches
 *
 * Returns { frames, loadedCount, started } where frames[i] is the
 * HTMLImageElement (or null until loaded). Components draw via
 * frames[i] if non-null.
 */
export function useFrameLoader({ count, urlFor, observeRef }: Options) {
  const framesRef = useRef<(HTMLImageElement | null)[]>(
    new Array(count).fill(null),
  );
  const [loadedCount, setLoadedCount] = useState(0);
  const [started, setStarted] = useState(false);

  // Start when in view (or immediately if no observe ref provided)
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
      { rootMargin: "200px" },
    );
    obs.observe(observeRef.current);
    return () => obs.disconnect();
  }, [observeRef]);

  useEffect(() => {
    if (!started) return;

    function loadOne(i: number): Promise<void> {
      return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
          framesRef.current[i] = img;
          setLoadedCount((n) => n + 1);
          resolve();
        };
        img.onerror = () => resolve(); // tolerate missing frames
        img.src = urlFor(i);
      });
    }

    // 1) frame 0 immediately
    void loadOne(0);

    // 2) frames 1-30 in parallel
    const eager = Array.from({ length: Math.min(30, count - 1) }, (_, k) =>
      loadOne(k + 1),
    );
    void Promise.all(eager);

    // 3) the rest lazily in batches of 10
    let cursor = 31;
    function nextBatch() {
      if (cursor >= count) return;
      const end = Math.min(count, cursor + 10);
      const batch = [];
      for (let i = cursor; i < end; i++) batch.push(loadOne(i));
      cursor = end;
      Promise.all(batch).then(() => {
        if (typeof window.requestIdleCallback === "function") {
          window.requestIdleCallback(nextBatch, { timeout: 1000 });
        } else {
          setTimeout(nextBatch, 50);
        }
      });
    }
    nextBatch();
  }, [started, count, urlFor]);

  return { frames: framesRef.current, loadedCount, started };
}
