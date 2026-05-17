"use client";

import { useEffect, useRef, useState } from "react";
import type { ProductFilters } from "@/lib/queries/products";
import type { PlpState } from "../../_lib/plp-params";
import { FilterSidebar } from "./filter-sidebar";

/* MobileFilterDrawer — one-thumb bottom sheet wrapping FilterSidebar.
   Focus trap + Escape. Shown only ≤960px via the trigger button. */

export interface MobileFilterDrawerProps {
  filters: ProductFilters;
  state: PlpState;
  basePath: string;
  total: number;
}

export function MobileFilterDrawer({
  filters,
  state,
  basePath,
  total,
}: MobileFilterDrawerProps) {
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const returnRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;
    returnRef.current = document.activeElement as HTMLElement;
    const id = setTimeout(() => closeRef.current?.focus(), 40);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        return;
      }
      if (e.key !== "Tab" || !panelRef.current) return;
      const f = panelRef.current.querySelectorAll<HTMLElement>(
        "a[href],button:not([disabled]),input:not([disabled]),select",
      );
      if (f.length === 0) return;
      const first = f[0];
      const last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      clearTimeout(id);
      document.removeEventListener("keydown", onKey);
      returnRef.current?.focus();
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        className="v3-mfd-trigger"
        onClick={() => setOpen(true)}
      >
        Φίλτρα
      </button>

      {open && (
        <div className="v3-mfd-overlay" role="presentation">
          <button
            type="button"
            className="v3-mfd-backdrop"
            aria-label="Κλείσιμο φίλτρων"
            onClick={() => setOpen(false)}
          />
          <div
            ref={panelRef}
            className="v3-mfd-panel"
            role="dialog"
            aria-modal="true"
            aria-label="Φίλτρα προϊόντων"
          >
            <div className="v3-mfd-head">
              <strong>Φίλτρα</strong>
              <button
                ref={closeRef}
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Κλείσιμο"
              >
                ✕
              </button>
            </div>
            <div className="v3-mfd-body">
              <FilterSidebar
                filters={filters}
                state={state}
                basePath={basePath}
              />
            </div>
            <button
              type="button"
              className="v3-btn-primary v3-mfd-apply"
              onClick={() => setOpen(false)}
            >
              Δες {total} προϊόντα
            </button>
          </div>
        </div>
      )}

      <style precedence="default">{`
        .v3-mfd-trigger {
          display: none; height: 44px; padding: 0 18px; cursor: pointer;
          background: var(--v3-surface); color: var(--v3-bone);
          border: 1px solid var(--v3-line); border-radius: 8px; font-weight: 700;
        }
        .v3-mfd-overlay { position: fixed; inset: 0; z-index: 120;
          display: flex; align-items: flex-end; }
        .v3-mfd-backdrop {
          position: absolute; inset: 0; border: 0; cursor: pointer;
          background: rgba(0,0,0,.6);
        }
        .v3-mfd-panel {
          position: relative; width: 100%; max-height: 86vh;
          display: flex; flex-direction: column;
          background: var(--v3-graphite);
          border-top-left-radius: 16px; border-top-right-radius: 16px;
          border-top: 1px solid var(--v3-line);
        }
        .v3-mfd-head {
          display: flex; align-items: center; justify-content: space-between;
          padding: 16px 20px; border-bottom: 1px solid var(--v3-line);
          color: var(--v3-bone);
        }
        .v3-mfd-head button {
          background: none; border: 0; color: var(--v3-bone-dim);
          font-size: 1.1rem; cursor: pointer;
        }
        .v3-mfd-body { overflow-y: auto; padding: 20px; }
        .v3-mfd-apply {
          margin: 0 16px 16px; text-align: center;
        }
        @media (max-width: 960px) {
          .v3-mfd-trigger { display: inline-block; }
        }
        @media (prefers-reduced-motion: reduce) {
          .v3-mfd-panel { transition: none; }
        }
      `}</style>
    </>
  );
}
