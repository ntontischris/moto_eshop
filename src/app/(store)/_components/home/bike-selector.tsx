"use client";

/* eslint-disable @next/next/no-img-element -- small static manufacturer logos inside chips; white-on-transparent PNGs sized by CSS */

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Bike,
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal,
} from "lucide-react";
import type { BikeBrand } from "@/lib/queries/categories";

/** Manufacturer logos available in /public/brands/bikes (white-on-transparent). */
const BIKE_LOGOS = new Set([
  "aprilia",
  "benelli",
  "bmw",
  "cfmoto",
  "ducati",
  "gilera",
  "honda",
  "husqvarna",
  "kawasaki",
  "keeway",
  "ktm",
  "kymco",
  "mbk",
  "motoguzzi",
  "peugeot",
  "piaggio",
  "qjmotor",
  "royalenfield",
  "suzuki",
  "sym",
  "triumph",
  "voge",
  "yamaha",
  "zontes",
]);

const logoSlug = (name: string) => name.toLowerCase().replace(/[^a-z0-9]/g, "");

const PRIORITY = [
  "Yamaha",
  "Honda",
  "BMW",
  "KTM",
  "Ducati",
  "Kawasaki",
  "Suzuki",
  "Aprilia",
];

/** All brands, popular ones first — quick-pick chips (with logos where we have them). */
function orderBrands(brands: BikeBrand[]): BikeBrand[] {
  const out: BikeBrand[] = [];
  const taken = new Set<string>();
  for (const name of PRIORITY) {
    const b = brands.find((x) => x.name.toLowerCase() === name.toLowerCase());
    if (b && !taken.has(b.slug)) {
      out.push(b);
      taken.add(b.slug);
    }
  }
  for (const b of brands) {
    if (!taken.has(b.slug)) {
      out.push(b);
      taken.add(b.slug);
    }
  }
  return out;
}

export function BikeSelector({ brands }: { brands: BikeBrand[] }) {
  const router = useRouter();
  const [brandSlug, setBrandSlug] = useState("");
  const [modelSlug, setModelSlug] = useState("");

  const models = brands.find((b) => b.slug === brandSlug)?.models ?? [];
  const target = modelSlug || brandSlug;
  const popular = orderBrands(brands);
  const chipsRef = useRef<HTMLDivElement>(null);

  function scrollChips(dir: number) {
    chipsRef.current?.scrollBy({ left: dir * 200, behavior: "smooth" });
  }

  return (
    <div className="v3-mb-console">
      <div className="v3-mb-console-head">
        <Bike size={22} aria-hidden="true" />
        <span>Garage selector</span>
        <SlidersHorizontal size={18} aria-hidden="true" />
      </div>

      <div className="v3-mb-form">
        <label className="v3-mb-field">
          <span>Μάρκα</span>
          <select
            value={brandSlug}
            onChange={(e) => {
              setBrandSlug(e.target.value);
              setModelSlug("");
            }}
          >
            <option value="">Επίλεξε μάρκα</option>
            {brands.map((b) => (
              <option key={b.slug} value={b.slug}>
                {b.name}
              </option>
            ))}
          </select>
        </label>

        <label className="v3-mb-field">
          <span>Μοντέλο</span>
          <select
            value={modelSlug}
            onChange={(e) => setModelSlug(e.target.value)}
            disabled={!brandSlug || models.length === 0}
          >
            <option value="">
              {!brandSlug
                ? "Πρώτα διάλεξε μάρκα"
                : models.length === 0
                  ? "—"
                  : "Όλα τα μοντέλα"}
            </option>
            {models.map((m) => (
              <option key={m.slug} value={m.slug}>
                {m.name}
              </option>
            ))}
          </select>
        </label>

        <button
          type="button"
          className="v3-btn-primary"
          onClick={() => target && router.push(`/category/${target}`)}
          disabled={!target}
        >
          Βρες setup <ChevronRight size={18} aria-hidden="true" />
        </button>
      </div>

      <div className="v3-mb-chips">
        <span className="v3-mb-chips-label">Όλες οι μάρκες</span>
        <div className="v3-mb-chips-rail">
          <button
            type="button"
            className="v3-mb-chips-arrow"
            onClick={() => scrollChips(-1)}
            aria-label="Προηγούμενες μάρκες"
          >
            <ChevronLeft size={16} aria-hidden="true" />
          </button>
          <div className="v3-mb-chips-row" ref={chipsRef}>
            {popular.map((b) => {
              const slug = logoSlug(b.name);
              const hasLogo = BIKE_LOGOS.has(slug);
              return (
                <button
                  key={b.slug}
                  type="button"
                  className="v3-mb-chip"
                  data-active={b.slug === brandSlug}
                  data-logo={hasLogo || undefined}
                  onClick={() => {
                    setBrandSlug(b.slug);
                    setModelSlug("");
                  }}
                >
                  {hasLogo && (
                    <img
                      className="v3-mb-chip-logo"
                      src={`/brands/bikes/${slug}.png`}
                      alt=""
                      loading="lazy"
                      decoding="async"
                    />
                  )}
                  <span>{b.name}</span>
                </button>
              );
            })}
          </div>
          <button
            type="button"
            className="v3-mb-chips-arrow"
            onClick={() => scrollChips(1)}
            aria-label="Επόμενες μάρκες"
          >
            <ChevronRight size={16} aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  );
}
