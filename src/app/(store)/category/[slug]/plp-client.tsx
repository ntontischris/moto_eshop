"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ProductFilters, SortOption } from "@/lib/queries/products";
import type { PlpState } from "../../_lib/plp-params";
import { buildPlpQuery } from "../../_lib/plp-params";
import { FilterSidebar } from "../../_components/filters/filter-sidebar";
import { MobileFilterDrawer } from "../../_components/filters/mobile-filter-drawer";

const SORTS: { value: SortOption; label: string }[] = [
  { value: "popular", label: "Προτεινόμενα" },
  { value: "newest", label: "Νεότερα" },
  { value: "price_asc", label: "Τιμή: αύξουσα" },
  { value: "price_desc", label: "Τιμή: φθίνουσα" },
  { value: "rating", label: "Βαθμολογία" },
];

export interface PLPClientProps {
  slug: string;
  title: string;
  seoIntro: string | null;
  subcategories: { slug: string; name: string }[];
  filters: ProductFilters;
  state: PlpState;
  total: number;
  page: number;
  totalPages: number;
  children: React.ReactNode;
}

export function PLPClient({
  slug,
  title,
  seoIntro,
  subcategories,
  filters,
  state,
  total,
  page,
  totalPages,
  children,
}: PLPClientProps) {
  const router = useRouter();
  const basePath = `/category/${slug}`;
  const push = (next: PlpState) => router.push(basePath + buildPlpQuery(next));

  const brandName = (s: string) =>
    filters.brands.find((b) => b.slug === s)?.name ?? s;

  const activeChips = [
    ...state.brands.map((b) => ({
      key: `b:${b}`,
      label: brandName(b),
      clear: () =>
        push({
          ...state,
          brands: state.brands.filter((x) => x !== b),
          page: 1,
        }),
    })),
    ...(state.priceMin != null || state.priceMax != null
      ? [
          {
            key: "price",
            label: `€${state.priceMin ?? 0}–${state.priceMax ?? "∞"}`,
            clear: () =>
              push({
                ...state,
                priceMin: undefined,
                priceMax: undefined,
                page: 1,
              }),
          },
        ]
      : []),
  ];

  return (
    <div className="v3-plp">
      <nav className="v3-plp-bc" aria-label="Breadcrumb">
        <Link href="/">Αρχική</Link>
        <span aria-hidden="true">/</span>
        <span>{title}</span>
      </nav>

      <header className="v3-plp-head">
        <h1>{title}</h1>
        {seoIntro && <p className="v3-plp-intro">{seoIntro}</p>}
      </header>

      {subcategories.length > 0 && (
        <div className="v3-plp-chips" aria-label="Υποκατηγορίες">
          {subcategories.map((s) => (
            <Link
              key={s.slug}
              href={`/category/${s.slug}`}
              className="v3-plp-chip"
            >
              {s.name}
            </Link>
          ))}
        </div>
      )}

      <div className="v3-plp-bar">
        <span className="v3-plp-count">{total} προϊόντα</span>
        <div className="v3-plp-bar-r">
          <MobileFilterDrawer
            filters={filters}
            state={state}
            basePath={basePath}
            total={total}
          />
          <label className="v3-plp-sort">
            <span>Ταξινόμηση</span>
            <select
              value={state.sort}
              onChange={(e) =>
                push({ ...state, sort: e.target.value as SortOption, page: 1 })
              }
            >
              {SORTS.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      {activeChips.length > 0 && (
        <div className="v3-plp-active">
          {activeChips.map((c) => (
            <button
              key={c.key}
              type="button"
              className="v3-plp-active-chip"
              onClick={c.clear}
            >
              {c.label} <span aria-hidden="true">✕</span>
            </button>
          ))}
        </div>
      )}

      <div className="v3-plp-body">
        <div className="v3-plp-side">
          <FilterSidebar filters={filters} state={state} basePath={basePath} />
        </div>
        <div className="v3-plp-main">
          <div className="v3-plp-grid">{children}</div>
          {totalPages > 1 && (
            <nav className="v3-plp-pager" aria-label="Σελιδοποίηση">
              {page > 1 && (
                <Link
                  href={basePath + buildPlpQuery({ ...state, page: page - 1 })}
                >
                  ← Προηγούμενη
                </Link>
              )}
              <span>
                Σελίδα {page} / {totalPages}
              </span>
              {page < totalPages && (
                <Link
                  href={basePath + buildPlpQuery({ ...state, page: page + 1 })}
                >
                  Επόμενη →
                </Link>
              )}
            </nav>
          )}
        </div>
      </div>

      <style precedence="default">{`
        .v3-plp { max-width: 1320px; margin: 0 auto;
          padding: 28px var(--v3-gutter) 80px; }
        .v3-plp-bc { display: flex; gap: 8px; font-size: .82rem;
          color: var(--v3-bone-dim); margin-bottom: 18px; }
        .v3-plp-bc a { color: var(--v3-bone-dim); text-decoration: none; }
        .v3-plp-bc a:hover { color: var(--v3-bone); }
        .v3-plp-head h1 { margin: 0;
          font-family: var(--v3-display);
          font-size: clamp(2.2rem, 6vw, 4.4rem);
          font-weight: 900; color: var(--v3-bone);
          text-transform: uppercase; transform: skewX(-6deg);
          line-height: .95; }
        .v3-plp-intro { margin: 10px 0 0; max-width: 720px;
          color: var(--v3-bone-dim); line-height: 1.5; font-size: .92rem; }
        .v3-plp-chips { display: flex; flex-wrap: wrap; gap: 8px;
          margin: 20px 0 4px; }
        .v3-plp-chip { padding: 7px 14px; border-radius: 999px;
          background: var(--v3-surface); border: 1px solid var(--v3-line);
          color: var(--v3-bone-dim); text-decoration: none; font-size: .82rem; }
        .v3-plp-chip:hover { color: var(--v3-bone);
          border-color: var(--v3-bone-dim); }
        .v3-plp-bar { display: flex; align-items: center;
          justify-content: space-between; gap: 16px; margin: 22px 0;
          padding-bottom: 14px; border-bottom: 1px solid var(--v3-line); }
        .v3-plp-count { color: var(--v3-bone-dim); font-size: .9rem; }
        .v3-plp-bar-r { display: flex; align-items: center; gap: 12px; }
        .v3-plp-sort { display: flex; align-items: center; gap: 8px;
          font-size: .85rem; color: var(--v3-bone-dim); }
        .v3-plp-sort select { height: 40px; padding: 0 10px; border-radius: 8px;
          background: var(--v3-surface); border: 1px solid var(--v3-line);
          color: var(--v3-bone); }
        .v3-plp-active { display: flex; flex-wrap: wrap; gap: 8px;
          margin-bottom: 18px; }
        .v3-plp-active-chip { cursor: pointer; padding: 6px 12px;
          border-radius: 999px; background: var(--v3-red); color: #fff;
          border: 0; font-size: .8rem; font-weight: 600; }
        .v3-plp-body { display: grid; grid-template-columns: 260px 1fr;
          gap: 36px; align-items: start; }
        .v3-plp-side { position: sticky; top: 96px; }
        .v3-plp-grid { display: grid;
          grid-template-columns: repeat(3, 1fr); gap: 18px; }
        .v3-plp-pager { display: flex; align-items: center; gap: 18px;
          justify-content: center; margin-top: 40px;
          color: var(--v3-bone-dim); }
        .v3-plp-pager a { color: var(--v3-bone); text-decoration: none;
          font-weight: 700; }
        .v3-plp :focus-visible { outline: 2px solid var(--v3-cyan);
          outline-offset: 2px; }
        @media (max-width: 1100px) {
          .v3-plp-grid { grid-template-columns: repeat(2, 1fr); }
        }
        @media (max-width: 960px) {
          .v3-plp-body { grid-template-columns: 1fr; }
          .v3-plp-side { display: none; }
        }
        @media (max-width: 480px) {
          .v3-plp-grid { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  );
}
