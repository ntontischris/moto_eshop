"use client";

import {
  useCallback,
  useEffect,
  useReducer,
  useRef,
  type KeyboardEvent,
} from "react";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { ArrowRight, Map, ShieldCheck } from "lucide-react";
import { LqipImage } from "../fx/lqip-image";
import {
  createRideRotationState,
  isRotationRunning,
  rideRotationReducer,
} from "../../_lib/ride-rotation";

const RIDES = [
  {
    label: "Racing",
    href: "/category/racing-gear",
    valueKey: "raceRacingValue",
    image: "/ride-selector/ride-racing.webp",
    thumb: "/ride-selector/ride-racing-thumb.webp",
    kicker: "Track setup",
    headline: "Racing gear",
    metric: "Grip / aero / protection",
  },
  {
    label: "Adventure",
    href: "/off-road",
    valueKey: "raceAdventureValue",
    image: "/ride-selector/ride-adventure.webp",
    thumb: "/ride-selector/ride-adventure-thumb.webp",
    kicker: "Long range",
    headline: "Adventure kit",
    metric: "Luggage / armor / tyres",
  },
  {
    label: "Touring",
    href: "/eksoplismos-motosikletas",
    valueKey: "raceTouringValue",
    image: "/ride-selector/ride-touring.webp",
    thumb: "/ride-selector/ride-touring-thumb.webp",
    kicker: "Grand touring",
    headline: "Touring comfort",
    metric: "Cases / windscreen / layers",
  },
  {
    label: "Urban",
    href: "/eksoplismos-anabath",
    valueKey: "raceUrbanValue",
    image: "/ride-selector/ride-urban.webp",
    thumb: "/ride-selector/ride-urban-thumb.webp",
    kicker: "City ready",
    headline: "Urban equipment",
    metric: "Helmet / jacket / gloves",
  },
  {
    label: "Rain / Winter",
    href: "/search?q=waterproof",
    valueKey: "raceRainValue",
    image: "/ride-selector/ride-rain-winter.webp",
    thumb: "/ride-selector/ride-rain-winter-thumb.webp",
    kicker: "All weather",
    headline: "Rain control",
    metric: "Waterproof / thermal / visibility",
  },
  {
    label: "Parts",
    href: "/category/antallaktika",
    valueKey: "racePartsValue",
    image: "/ride-selector/ride-parts.webp",
    thumb: "/ride-selector/ride-parts-thumb.webp",
    kicker: "Workshop",
    headline: "Parts setup",
    metric: "Chain / brakes / service",
  },
] as const;

const ROTATION_MS = 3000;
const reduceRotation = rideRotationReducer(RIDES.length);

function prefersReducedMotion(): boolean {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

export function RaceControlPanel() {
  const t = useTranslations("home");
  const sectionRef = useRef<HTMLElement>(null);
  const [state, dispatch] = useReducer(
    reduceRotation,
    0,
    createRideRotationState,
  );
  const { activeIndex } = state;
  const activeRide = RIDES[activeIndex];
  const isRunning = isRotationRunning(state);

  // Auto-advance timer. Off entirely under reduced motion; otherwise restarts on
  // every active-index / pause change so the 3s dwell stays in sync with the CSS
  // progress bar that animates from the same data-active flip.
  useEffect(() => {
    if (!isRunning || prefersReducedMotion()) return;
    const id = window.setTimeout(
      () => dispatch({ type: "advance" }),
      ROTATION_MS,
    );
    return () => window.clearTimeout(id);
  }, [isRunning, activeIndex]);

  // Smart pause: stop rotating while the section is scrolled out of view.
  useEffect(() => {
    const el = sectionRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(
      (entries) => {
        const visible = entries[0]?.isIntersecting ?? true;
        dispatch({ type: visible ? "resume" : "pause", reason: "offscreen" });
      },
      { threshold: 0.25 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // Smart pause: stop rotating while the browser tab is hidden.
  useEffect(() => {
    const onVisibility = () =>
      dispatch({
        type: document.hidden ? "pause" : "resume",
        reason: "hidden",
      });
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);

  const handleTabKeyDown = useCallback(
    (event: KeyboardEvent<HTMLDivElement>) => {
      if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return;
      event.preventDefault();
      const tabs = Array.from(
        event.currentTarget.querySelectorAll<HTMLButtonElement>('[role="tab"]'),
      );
      const current = tabs.indexOf(document.activeElement as HTMLButtonElement);
      const delta = event.key === "ArrowRight" ? 1 : -1;
      const next = (current + delta + tabs.length) % tabs.length;
      tabs[next]?.focus();
    },
    [],
  );

  return (
    <section
      ref={sectionRef}
      className="v3-ride-selector v3-ride-selector--cinema"
      data-auto-paused={isRunning ? undefined : "true"}
      aria-label={t("raceShopByRide")}
      onMouseEnter={() => dispatch({ type: "pause", reason: "hover" })}
      onMouseLeave={() => dispatch({ type: "resume", reason: "hover" })}
      onFocusCapture={() => dispatch({ type: "pause", reason: "focus" })}
      onBlurCapture={(event) => {
        const nextFocused = event.relatedTarget as Node | null;
        if (!event.currentTarget.contains(nextFocused)) {
          dispatch({ type: "resume", reason: "focus" });
        }
      }}
    >
      <div className="v3-ride-selector-inner">
        <div className="v3-ride-head">
          <div>
            <p className="v3-label">Shop by ride</p>
            <h2 className="v3-display">{t("raceHeading")}</h2>
          </div>
          <Link href="/eksoplismos-anabath" className="v3-ride-all">
            {t("raceAllGear")} <span aria-hidden="true">→</span>
          </Link>
        </div>

        <div className="v3-ride-cinema">
          <Link
            className="v3-ride-focus"
            href={activeRide.href}
            aria-label={t("raceSeeLabel", { label: activeRide.label })}
          >
            <span className="v3-ride-focus-media" aria-hidden="true">
              {RIDES.map((ride, index) => (
                <span
                  key={ride.image}
                  className="v3-ride-focus-layer"
                  data-active={index === activeIndex ? "true" : undefined}
                >
                  <LqipImage
                    src={ride.image}
                    alt=""
                    sizes="(max-width: 920px) 100vw, 64vw"
                    loading="lazy"
                    fetchPriority="low"
                    unoptimized
                  />
                </span>
              ))}
              <span className="v3-ride-focus-overlay" />
            </span>

            <span className="v3-ride-focus-copy">
              <span className="v3-ride-focus-kicker">{activeRide.kicker}</span>
              <strong>{activeRide.headline}</strong>
              <span>{t(activeRide.valueKey)}</span>
              <span className="v3-ride-focus-cta">
                {t("raceSeeOptions")}{" "}
                <ArrowRight size={16} aria-hidden="true" />
              </span>
            </span>

            <span className="v3-ride-focus-spec">
              <span>Selected ride</span>
              <strong>{activeRide.metric}</strong>
            </span>
          </Link>

          <div
            className="v3-ride-tabs"
            role="tablist"
            aria-label={t("raceTabs")}
            onKeyDown={handleTabKeyDown}
          >
            {RIDES.map(({ label, valueKey, thumb }, index) => {
              const isActive = index === activeIndex;

              return (
                <button
                  className="v3-ride-tab"
                  data-active={isActive ? "true" : undefined}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  tabIndex={isActive ? 0 : -1}
                  key={label}
                  onClick={() => dispatch({ type: "select", index })}
                  onFocus={() => dispatch({ type: "select", index })}
                  onMouseEnter={() => dispatch({ type: "select", index })}
                >
                  <span className="v3-ride-tab-thumb" aria-hidden="true">
                    <LqipImage
                      src={thumb}
                      alt=""
                      sizes="88px"
                      loading="lazy"
                      fetchPriority="low"
                    />
                  </span>
                  <span className="v3-ride-tab-copy">
                    <strong>{label}</strong>
                    <span>{t(valueKey)}</span>
                  </span>
                  <span className="v3-ride-tab-progress" aria-hidden="true" />
                </button>
              );
            })}
          </div>
        </div>

        <p className="v3-sr-only" aria-live="polite">
          {t("raceActiveRide", { label: activeRide.label })}
        </p>

        <div className="v3-ride-trust" aria-label="MotoMarket service">
          <ShieldCheck size={18} aria-hidden="true" />
          <span>
            <strong>Official</strong>
            {t("raceTrustOfficial")}
          </span>
          <span>
            <strong>Fit</strong>
            {t("raceTrustFit")}
          </span>
          <span>
            <strong>Support</strong>
            210 95 35 195
          </span>
          <Map size={18} aria-hidden="true" />
        </div>
      </div>
    </section>
  );
}
