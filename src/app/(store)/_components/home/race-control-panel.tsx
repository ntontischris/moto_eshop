"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  Map,
  ShieldCheck,
} from "lucide-react";

const RIDES = [
  {
    label: "Racing",
    href: "/category/racing-gear",
    value: "Φόρμες, γάντια, μπότες",
    image: "/ride-selector/ride-racing.webp",
    thumb: "/ride-selector/ride-racing-thumb.webp",
    kicker: "Track setup",
    headline: "Racing gear",
    metric: "Grip / aero / protection",
  },
  {
    label: "Adventure",
    href: "/category/off-road",
    value: "Κράνη, βαλίτσες, προστασίες",
    image: "/ride-selector/ride-adventure.webp",
    thumb: "/ride-selector/ride-adventure-thumb.webp",
    kicker: "Long range",
    headline: "Adventure kit",
    metric: "Luggage / armor / tyres",
  },
  {
    label: "Touring",
    href: "/category/eksoplismos-motosikletas",
    value: "Ζελατίνες, βαλίτσες, άνεση",
    image: "/ride-selector/ride-touring.webp",
    thumb: "/ride-selector/ride-touring-thumb.webp",
    kicker: "Grand touring",
    headline: "Touring comfort",
    metric: "Cases / windscreen / layers",
  },
  {
    label: "Urban",
    href: "/category/eksoplismos-anabath",
    value: "Κράνος, μπουφάν, καθημερινά",
    image: "/ride-selector/ride-urban.webp",
    thumb: "/ride-selector/ride-urban-thumb.webp",
    kicker: "City ready",
    headline: "Urban equipment",
    metric: "Helmet / jacket / gloves",
  },
  {
    label: "Rain / Winter",
    href: "/search?q=waterproof",
    value: "Αδιάβροχα, θερμικά, γκριπ",
    image: "/ride-selector/ride-rain-winter.webp",
    thumb: "/ride-selector/ride-rain-winter-thumb.webp",
    kicker: "All weather",
    headline: "Rain control",
    metric: "Waterproof / thermal / visibility",
  },
  {
    label: "Parts",
    href: "/category/antallaktika",
    value: "Service, αλυσίδα, φρένα",
    image: "/ride-selector/ride-parts.webp",
    thumb: "/ride-selector/ride-parts-thumb.webp",
    kicker: "Workshop",
    headline: "Parts setup",
    metric: "Chain / brakes / service",
  },
] as const;

const TRUST = [
  ["Official", "γνήσια προϊόντα"],
  ["Fit", "σωστό μέγεθος"],
  ["Support", "210 95 35 195"],
] as const;

export function RaceControlPanel() {
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
      aria-label="Αγορές ανά χρήση"
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
            <h2 className="v3-display">Τι οδηγείς σήμερα;</h2>
          </div>
          <Link href="/category/eksoplismos-anabath" className="v3-ride-all">
            Όλος ο εξοπλισμός <span aria-hidden="true">→</span>
          </Link>
        </div>

        <div className="v3-ride-cinema">
          <Link
            className="v3-ride-focus"
            href={activeRide.href}
            aria-label={`Δες ${activeRide.label}`}
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
              <span>{activeRide.value}</span>
              <span className="v3-ride-focus-cta">
                Δες επιλογές <ArrowRight size={16} aria-hidden="true" />
              </span>
            </span>

            <span className="v3-ride-focus-spec">
              <span>Selected ride</span>
              <strong>{activeRide.metric}</strong>
            </span>
          </Link>

          <div className="v3-ride-tabs" role="tablist" aria-label="Τύπος οδήγησης">
            {RIDES.map(({ label, value, thumb }, index) => {
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
                    <span>{value}</span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="v3-ride-trust" aria-label="MotoMarket service">
          <ShieldCheck size={18} aria-hidden="true" />
          {TRUST.map(([label, value]) => (
            <span key={label}>
              <strong>{label}</strong>
              {value}
            </span>
          ))}
          <Map size={18} aria-hidden="true" />
        </div>
      </div>
    </section>
  );
}
