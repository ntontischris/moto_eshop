"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
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
  const t = useTranslations("filters");
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
        {t("filtersLabel")}
      </button>

      {open && (
        <div className="v3-mfd-overlay" role="presentation">
          <button
            type="button"
            className="v3-mfd-backdrop"
            aria-label={t("filtersClose")}
            onClick={() => setOpen(false)}
          />
          <div
            ref={panelRef}
            className="v3-mfd-panel"
            role="dialog"
            aria-modal="true"
            aria-label={t("filtersDialog")}
          >
            <div className="v3-mfd-head">
              <strong>{t("filtersLabel")}</strong>
              <button
                ref={closeRef}
                type="button"
                onClick={() => setOpen(false)}
                aria-label={t("filtersClose")}
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
              {t("seeProducts", { total })}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
