"use client";

import { useEffect, useState } from "react";
import { Link } from "@/i18n/navigation";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { ArrowRight, Map, ShieldCheck } from "lucide-react";

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

export function RaceControlPanel() {
  const t = useTranslations("home");
  const [activeIndex, setActiveIndex] = useState(0);
  const [isAutoPaused, setIsAutoPaused] = useState(false);
  const activeRide = RIDES[activeIndex];

  useEffect(() => {
    if (isAutoPaused) {
      return;
    }

    const intervalId = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % RIDES.length);
    }, 3000);

    return () => window.clearInterval(intervalId);
  }, [isAutoPaused]);

  return (
    <section
      className="v3-ride-selector v3-ride-selector--cinema"
      data-auto-paused={isAutoPaused ? "true" : undefined}
      aria-label={t("raceShopByRide")}
      onMouseEnter={() => setIsAutoPaused(true)}
      onMouseLeave={() => setIsAutoPaused(false)}
      onFocusCapture={() => setIsAutoPaused(true)}
      onBlurCapture={(event) => {
        const nextFocused = event.relatedTarget as Node | null;
        if (!event.currentTarget.contains(nextFocused)) {
          setIsAutoPaused(false);
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
              <Image
                key={activeRide.image}
                src={activeRide.image}
                alt=""
                fill
                sizes="(max-width: 920px) 100vw, 64vw"
                loading="lazy"
                fetchPriority="low"
                unoptimized
              />
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
                  key={label}
                  onClick={() => setActiveIndex(index)}
                  onFocus={() => setActiveIndex(index)}
                  onMouseEnter={() => setActiveIndex(index)}
                >
                  <span className="v3-ride-tab-thumb" aria-hidden="true">
                    <Image
                      src={thumb}
                      alt=""
                      width={260}
                      height={190}
                      sizes="96px"
                      loading="lazy"
                      fetchPriority="low"
                      unoptimized
                    />
                  </span>
                  <span className="v3-ride-tab-copy">
                    <strong>{label}</strong>
                    <span>{t(valueKey)}</span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>

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
