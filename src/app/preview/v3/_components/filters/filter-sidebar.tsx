"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { ProductFilters } from "@/lib/queries/products";
import type { PlpState } from "../../_lib/plp-params";
import { buildPlpQuery } from "../../_lib/plp-params";

/* FilterSidebar — functional brand + price filters (URL-driven). Certification
   and rider-type are display-only until the PLP query backs them (PRD §22). */

export interface FilterSidebarProps {
  filters: ProductFilters;
  state: PlpState;
  basePath: string;
}

export function FilterSidebar({
  filters,
  state,
  basePath,
}: FilterSidebarProps) {
  const router = useRouter();
  const [min, setMin] = useState(state.priceMin?.toString() ?? "");
  const [max, setMax] = useState(state.priceMax?.toString() ?? "");

  const go = (next: PlpState) =>
    router.push(basePath + buildPlpQuery({ ...next, page: 1 }));

  const toggleBrand = (slug: string) => {
    const brands = state.brands.includes(slug)
      ? state.brands.filter((b) => b !== slug)
      : [...state.brands, slug];
    go({ ...state, brands });
  };

  const applyPrice = () =>
    go({
      ...state,
      priceMin: min ? Number(min) : undefined,
      priceMax: max ? Number(max) : undefined,
    });

  return (
    <aside className="v3-fs" aria-label="Φίλτρα">
      <section className="v3-fs-grp">
        <h3>Κατασκευαστής</h3>
        <ul>
          {filters.brands.map((b) => (
            <li key={b.slug}>
              <label>
                <input
                  type="checkbox"
                  checked={state.brands.includes(b.slug)}
                  onChange={() => toggleBrand(b.slug)}
                />
                <span>{b.name}</span>
                <em>{b.count}</em>
              </label>
            </li>
          ))}
        </ul>
      </section>

      <section className="v3-fs-grp">
        <h3>Τιμή (€)</h3>
        <div className="v3-fs-price">
          <input
            type="number"
            inputMode="numeric"
            placeholder={String(filters.price_range.min)}
            value={min}
            aria-label="Ελάχιστη τιμή"
            onChange={(e) => setMin(e.target.value)}
          />
          <span>—</span>
          <input
            type="number"
            inputMode="numeric"
            placeholder={String(filters.price_range.max)}
            value={max}
            aria-label="Μέγιστη τιμή"
            onChange={(e) => setMax(e.target.value)}
          />
        </div>
        <button type="button" className="v3-fs-apply" onClick={applyPrice}>
          Εφαρμογή τιμής
        </button>
      </section>

      {filters.certifications.length > 0 && (
        <section className="v3-fs-grp v3-fs-soft">
          <h3>
            Πιστοποίηση <span>σύντομα</span>
          </h3>
          <ul>
            {filters.certifications.map((c) => (
              <li key={c.value} className="v3-fs-disabled">
                <span>{c.value}</span>
                <em>{c.count}</em>
              </li>
            ))}
          </ul>
        </section>
      )}

      {filters.rider_types.length > 0 && (
        <section className="v3-fs-grp v3-fs-soft">
          <h3>
            Χρήση <span>σύντομα</span>
          </h3>
          <ul>
            {filters.rider_types.map((r) => (
              <li key={r.value} className="v3-fs-disabled">
                <span>{r.value}</span>
                <em>{r.count}</em>
              </li>
            ))}
          </ul>
        </section>
      )}

      <style precedence="default">{`
        .v3-fs { display: flex; flex-direction: column; gap: 26px; }
        .v3-fs-grp h3 {
          margin: 0 0 12px; font-size: .95rem; font-weight: 700;
          color: var(--v3-bone); display: flex; gap: 8px; align-items: center;
        }
        .v3-fs-grp h3 span {
          font-size: .68rem; font-weight: 600; color: var(--v3-carbon);
          background: var(--v3-cyan); padding: 2px 6px; border-radius: 4px;
          text-transform: uppercase;
        }
        .v3-fs-grp ul { list-style: none; margin: 0; padding: 0;
          display: flex; flex-direction: column; gap: 8px; }
        .v3-fs-grp label {
          display: flex; align-items: center; gap: 8px; cursor: pointer;
          font-size: .88rem; color: var(--v3-bone-dim);
        }
        .v3-fs-grp label:hover { color: var(--v3-bone); }
        .v3-fs-grp label em {
          margin-left: auto; font-style: normal; font-size: .76rem;
          color: var(--v3-bone-dim);
        }
        .v3-fs-price { display: flex; align-items: center; gap: 8px; }
        .v3-fs-price input {
          width: 100%; height: 42px; padding: 0 10px; border-radius: 8px;
          background: var(--v3-surface); border: 1px solid var(--v3-line);
          color: var(--v3-bone);
        }
        .v3-fs-apply {
          margin-top: 10px; width: 100%; height: 42px; cursor: pointer;
          background: var(--v3-surface); color: var(--v3-bone);
          border: 1px solid var(--v3-line); border-radius: 8px; font-weight: 700;
        }
        .v3-fs-apply:hover { border-color: var(--v3-bone-dim); }
        .v3-fs-soft .v3-fs-disabled {
          display: flex; font-size: .85rem; color: var(--v3-bone-dim);
          opacity: .55;
        }
        .v3-fs-soft .v3-fs-disabled em {
          margin-left: auto; font-style: normal;
        }
        .v3-fs :focus-visible { outline: 2px solid var(--v3-cyan);
          outline-offset: 2px; }
      `}</style>
    </aside>
  );
}
