"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Bike, ChevronRight, SlidersHorizontal } from "lucide-react";
import type { BikeBrand } from "@/lib/queries/categories";

export function BikeSelector({ brands }: { brands: BikeBrand[] }) {
  const router = useRouter();
  const [brandSlug, setBrandSlug] = useState("");
  const [modelSlug, setModelSlug] = useState("");

  const models = brands.find((b) => b.slug === brandSlug)?.models ?? [];
  const target = modelSlug || brandSlug;

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

      <p className="v3-mb-note">
        Διάλεξε μάρκα (και μοντέλο) για να δεις ό,τι ταιριάζει στη μηχανή σου.
      </p>
    </div>
  );
}
