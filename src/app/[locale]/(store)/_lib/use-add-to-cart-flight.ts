"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  canStartAdd,
  flightScale,
  nextMorphState,
  type CartMorphState,
  type Point,
} from "./add-to-cart-flight";

/* Selector for the header cart icon the ghost flies into. The header tags the
   icon with this attribute; if it is ever missing we just skip the flight (the
   badge still bumps), so the interaction degrades, never breaks. */
const CART_TARGET = "[data-cart-target]";
const BADGE_BUMP_CLASS = "is-bumped";
const SUCCESS_HOLD_MS = 1400;
const ERROR_HOLD_MS = 1800;
const FLIGHT_MS = 0.62;

interface FlightArgs {
  /** The button being pressed — flight starts from its centre. */
  button: HTMLElement;
  /** The product image URL used as the flying ghost. */
  image: string;
}

interface UseAddToCartFlight {
  state: CartMorphState;
  /** Run the add. `commit` performs the real (presentation-only) cart mutation
      and resolves; on throw the morph reverts to an error state. */
  trigger(args: FlightArgs, commit: () => void | Promise<void>): Promise<void>;
}

function prefersReducedMotion(): boolean {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

function centreOf(el: Element): Point {
  const r = el.getBoundingClientRect();
  return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
}

/* Bump the header cart badge so the new count reads as "just landed". The class
   self-clears on animationend; we also strip it defensively on the next add. */
function bumpCartBadge(): void {
  const badge = document.querySelector<HTMLElement>(
    `${CART_TARGET} .v3-cart-badge`,
  );
  if (!badge) return;
  badge.classList.remove(BADGE_BUMP_CLASS);
  // Force reflow so re-adding the class restarts the keyframe.
  void badge.offsetWidth;
  badge.classList.add(BADGE_BUMP_CLASS);
  badge.addEventListener(
    "animationend",
    () => badge.classList.remove(BADGE_BUMP_CLASS),
    { once: true },
  );
}

/* Fly a fixed-position ghost of the product image along an upward arc from the
   button to the header cart icon, shrinking to a dot, then remove it. Returns a
   promise that resolves when the ghost lands (or immediately if there is no
   target / GSAP fails to load). Pure geometry lives in add-to-cart-flight.ts. */
async function flyGhost(button: HTMLElement, image: string): Promise<void> {
  const target = document.querySelector(CART_TARGET);
  if (!target || !image) return;

  const origin = centreOf(button);
  const destination = centreOf(target);

  const ghost = document.createElement("div");
  ghost.className = "v3-cart-ghost";
  ghost.setAttribute("aria-hidden", "true");
  ghost.style.backgroundImage = `url("${CSS.escape(image)}")`;
  ghost.style.left = `${origin.x}px`;
  ghost.style.top = `${origin.y}px`;
  document.body.appendChild(ghost);

  try {
    const { gsap } = await import("gsap");
    const { arcControlPoint } = await import("./add-to-cart-flight");
    const control = arcControlPoint(origin, destination);
    await new Promise<void>((resolve) => {
      const proxy = { t: 0 };
      gsap.to(proxy, {
        t: 1,
        duration: FLIGHT_MS,
        ease: "power2.in",
        onUpdate: () => {
          const t = proxy.t;
          const mt = 1 - t;
          // Quadratic Bézier position via the same control point the tests use.
          const x =
            mt * mt * origin.x + 2 * mt * t * control.x + t * t * destination.x;
          const y =
            mt * mt * origin.y + 2 * mt * t * control.y + t * t * destination.y;
          gsap.set(ghost, {
            x: x - origin.x,
            y: y - origin.y,
            scale: flightScale(t),
            opacity: t > 0.85 ? (1 - t) / 0.15 : 1,
          });
        },
        onComplete: resolve,
      });
    });
  } catch {
    /* GSAP failed to load — fall through and just clean up the ghost. */
  } finally {
    ghost.remove();
  }
}

/* Orchestrates the add-to-cart morph + fly-to-cart. The morph state machine and
   flight geometry are the pure, tested core; this hook wires them to the DOM,
   the real cart commit, and the reduced-motion / no-target fallbacks. The cart
   contract (ADR 0001) is untouched — `commit` is the caller's existing add. */
export function useAddToCartFlight(): UseAddToCartFlight {
  const [state, setState] = useState<CartMorphState>("idle");
  const resetTimer = useRef<number | null>(null);

  useEffect(
    () => () => {
      if (resetTimer.current) window.clearTimeout(resetTimer.current);
    },
    [],
  );

  const scheduleReset = useCallback((delay: number) => {
    if (resetTimer.current) window.clearTimeout(resetTimer.current);
    resetTimer.current = window.setTimeout(() => {
      setState((s) => nextMorphState(s, "reset"));
    }, delay);
  }, []);

  const trigger = useCallback(
    async (
      { button, image }: FlightArgs,
      commit: () => void | Promise<void>,
    ) => {
      // Double-tap safe: ignore presses while a request is in flight.
      let blocked = false;
      setState((current) => {
        if (!canStartAdd(current)) {
          blocked = true;
          return current;
        }
        return nextMorphState(current, "press");
      });
      if (blocked) return;

      try {
        await commit();
        // Fly only when motion is allowed; reduced-motion just bumps the badge.
        if (!prefersReducedMotion()) await flyGhost(button, image);
        bumpCartBadge();
        setState((s) => nextMorphState(s, "resolve"));
        scheduleReset(SUCCESS_HOLD_MS);
      } catch {
        setState((s) => nextMorphState(s, "reject"));
        scheduleReset(ERROR_HOLD_MS);
      }
    },
    [scheduleReset],
  );

  return { state, trigger };
}
