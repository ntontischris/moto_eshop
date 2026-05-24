"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Bike, ChevronRight, SlidersHorizontal } from "lucide-react";
import type { BikeBrand } from "@/lib/queries/categories";

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

/** Popular brands first, then fill from the rest — always 8 real chips. */
function pickPopular(brands: BikeBrand[]): BikeBrand[] {
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
    if (out.length >= 8) break;
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
  const popular = pickPopular(brands);

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
        <span className="v3-mb-chips-label">Δημοφιλείς μάρκες</span>
        <div className="v3-mb-chips-row">
          {popular.map((b) => (
            <button
              key={b.slug}
              type="button"
              className="v3-mb-chip"
              data-active={b.slug === brandSlug}
              onClick={() => {
                setBrandSlug(b.slug);
                setModelSlug("");
              }}
            >
              {b.name}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
