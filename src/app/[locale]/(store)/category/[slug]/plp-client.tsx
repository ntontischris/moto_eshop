"use client";

import { Link } from "@/i18n/navigation";
import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import type { ProductFilters, SortOption } from "@/lib/queries/products";
import type { PlpState } from "../../_lib/plp-params";
import { buildPlpQuery } from "../../_lib/plp-params";
import { FilterSidebar } from "../../_components/filters/filter-sidebar";
import { MobileFilterDrawer } from "../../_components/filters/mobile-filter-drawer";

const SORT_VALUES: { value: SortOption; tKey: string }[] = [
  { value: "popular", tKey: "sortPopular" },
  { value: "newest", tKey: "sortNewest" },
  { value: "price_asc", tKey: "sortPriceAsc" },
  { value: "price_desc", tKey: "sortPriceDesc" },
  { value: "rating", tKey: "sortRating" },
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
  const t = useTranslations("plp");
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
        <Link href="/">{t("homeLabel")}</Link>
        <span aria-hidden="true">/</span>
        <span>{title}</span>
      </nav>

      <header className="v3-plp-head">
        <h1>{title}</h1>
        {seoIntro && <p className="v3-plp-intro">{seoIntro}</p>}
      </header>

      {subcategories.length > 0 && (
        <div className="v3-plp-chips" aria-label={t("subcategoriesLabel")}>
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
        <span className="v3-plp-count">{t("productCount", { total })}</span>
        <div className="v3-plp-bar-r">
          <MobileFilterDrawer
            filters={filters}
            state={state}
            basePath={basePath}
            total={total}
          />
          <label className="v3-plp-sort">
            <span>{t("sortLabel")}</span>
            <select
              value={state.sort}
              onChange={(e) =>
                push({ ...state, sort: e.target.value as SortOption, page: 1 })
              }
            >
              {SORT_VALUES.map((s) => (
                <option key={s.value} value={s.value}>
                  {t(s.tKey as Parameters<typeof t>[0])}
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
            <nav className="v3-plp-pager" aria-label={t("paginationLabel")}>
              {page > 1 && (
                <Link
                  href={basePath + buildPlpQuery({ ...state, page: page - 1 })}
                >
                  {t("prevPage")}
                </Link>
              )}
              <span>{t("pageInfo", { page, total: totalPages })}</span>
              {page < totalPages && (
                <Link
                  href={basePath + buildPlpQuery({ ...state, page: page + 1 })}
                >
                  {t("nextPage")}
                </Link>
              )}
            </nav>
          )}
        </div>
      </div>
    </div>
  );
}
