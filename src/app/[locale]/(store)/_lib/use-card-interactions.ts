"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  canRunCardInteractions,
  tiltRestTransform,
  tiltTransform,
} from "./card-interactions";

/* Shared interaction behaviour for every Velocità product card (ADR 0004 —
   enhance in place, one implementation). It owns:
   - `hot`: true while the card is hovered OR keyboard-focused, which drives the
     image swap + price odometer equivalently for pointer and keyboard users;
   - a pointer-driven 3D tilt that runs only on fine pointers without
     reduced-motion, written straight to the node via rAF (no re-render);
   - graceful teardown on leave/blur and unmount.
   `tiltLiftPx` lets a card tune the rest/hover transition feel; the tilt math
   itself is the pure, tested `tiltTransform`. */
export function useCardInteractions() {
  const cardRef = useRef<HTMLElement>(null);
  const frame = useRef<number | null>(null);
  const [hot, setHot] = useState(false);

  // Resolved once on mount: fine pointer + motion preference. SSR renders the
  // static card; the client upgrades it after this reads matchMedia.
  const canTilt = useRef(false);
  useEffect(() => {
    if (typeof window === "undefined") return;
    canTilt.current = canRunCardInteractions({
      hasFinePointer: window.matchMedia("(pointer: fine)").matches,
      prefersReducedMotion: window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches,
    });
  }, []);

  useEffect(
    () => () => {
      if (frame.current) cancelAnimationFrame(frame.current);
    },
    [],
  );

  const handleMove = useCallback((e: React.MouseEvent<HTMLElement>) => {
    const el = cardRef.current;
    // e.buttons !== 0 means a drag (the rail is being scrolled) — don't tilt.
    if (!el || !canTilt.current || e.buttons !== 0) return;
    const rect = el.getBoundingClientRect();
    const normX = (e.clientX - rect.left) / rect.width;
    const normY = (e.clientY - rect.top) / rect.height;
    if (frame.current) cancelAnimationFrame(frame.current);
    frame.current = requestAnimationFrame(() => {
      el.style.transform = tiltTransform(normX, normY);
    });
  }, []);

  const engage = useCallback(() => {
    setHot(true);
    const el = cardRef.current;
    if (!el || !canTilt.current) return;
    el.style.willChange = "transform";
    el.style.transition = "transform 0.1s ease-out";
  }, []);

  const release = useCallback(() => {
    setHot(false);
    const el = cardRef.current;
    if (!el) return;
    if (frame.current) cancelAnimationFrame(frame.current);
    el.style.transition = "transform 0.6s cubic-bezier(0.22, 1, 0.36, 1)";
    el.style.transform = tiltRestTransform();
    el.style.willChange = "auto";
  }, []);

  return {
    cardRef,
    hot,
    handlers: {
      onMouseEnter: engage,
      onMouseMove: handleMove,
      onMouseLeave: release,
      onFocus: engage,
      onBlur: release,
    },
  };
}
