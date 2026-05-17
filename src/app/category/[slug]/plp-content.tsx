"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { ProductCard, useMM } from "@/components/mm/mm-shell";
import type { Product } from "@/components/mm/mm-shell";
import type {
  ProductFilters,
  ProductListItem,
  SortOption,
} from "@/lib/queries/products";

type InitialFilters = {
  sort: SortOption;
  brands: string[];
  priceMin?: number;
  priceMax?: number;
};

export function PLPContent({
  slug,
  category,
  subcategories,
  products,
  total,
  page,
  totalPages,
  filters,
  initialFilters,
}: {
  slug: string;
  category: {
    name: string;
    description: string | null;
    image_url: string | null;
  };
  subcategories: { slug: string; name: string }[];
  products: ProductListItem[];
  total: number;
  page: number;
  totalPages: number;
  filters: ProductFilters;
  initialFilters: InitialFilters;
}) {
  const router = useRouter();
  const sp = useSearchParams();
  const [pending, startTransition] = useTransition();
  const { lang, t, addToCart, toggleWish, wishlist, toggleCompare, compare } =
    useMM();

  const setParam = (key: string, value: string | null) => {
    const next = new URLSearchParams(sp?.toString() ?? "");
    if (value === null || value === "") next.delete(key);
    else next.set(key, value);
    if (key !== "page") next.delete("page");
    startTransition(() => {
      router.push(`/category/${slug}?${next.toString()}`, { scroll: false });
    });
  };

  const toggleBrand = (brand: string) => {
    const cur = new Set(initialFilters.brands);
    if (cur.has(brand)) cur.delete(brand);
    else cur.add(brand);
    setParam("brands", cur.size === 0 ? null : Array.from(cur).join(","));
  };

  const setPriceBand = (
    band: "all" | "u50" | "50-150" | "150-500" | "500+",
  ) => {
    const next = new URLSearchParams(sp?.toString() ?? "");
    next.delete("page");
    if (band === "all") {
      next.delete("price_min");
      next.delete("price_max");
    } else if (band === "u50") {
      next.set("price_min", "0");
      next.set("price_max", "50");
    } else if (band === "50-150") {
      next.set("price_min", "50");
      next.set("price_max", "150");
    } else if (band === "150-500") {
      next.set("price_min", "150");
      next.set("price_max", "500");
    } else if (band === "500+") {
      next.set("price_min", "500");
      next.delete("price_max");
    }
    startTransition(() => {
      router.push(`/category/${slug}?${next.toString()}`, { scroll: false });
    });
  };

  const currentBand: "all" | "u50" | "50-150" | "150-500" | "500+" = (() => {
    const min = initialFilters.priceMin ?? 0;
    const max = initialFilters.priceMax;
    if (min === 0 && max === undefined) return "all";
    if (min === 0 && max === 50) return "u50";
    if (min === 50 && max === 150) return "50-150";
    if (min === 150 && max === 500) return "150-500";
    if (min === 500 && max === undefined) return "500+";
    return "all";
  })();

  const clearAll = () => {
    startTransition(() => {
      router.push(`/category/${slug}`, { scroll: false });
    });
  };

  const activeFilters =
    initialFilters.brands.length + (currentBand !== "all" ? 1 : 0);

  /* ProductListItem → Product (for ProductCard) */
  const toCardProduct = (p: ProductListItem): Product => {
    const oldPrice = p.compare_at_price ?? undefined;
    const isSale = !!oldPrice && oldPrice > p.price;
    return {
      id: p.slug,
      brand: p.brand,
      el: { name: p.name, cat: category.name },
      en: { name: p.name, cat: category.name },
      price: p.price,
      oldPrice,
      isSale,
      img: p.primary_image_url,
    };
  };

  return (
    <>
      <style>{`
        .plp { padding: 24px 0 96px; opacity: 1; transition: opacity 180ms ease; }
        .plp[data-pending="1"] { opacity: 0.7; }
        .plp__crumb { display: flex; gap: 8px; align-items: center; font-family: var(--mono); font-size: 10px; letter-spacing: 0.14em; text-transform: uppercase; color: var(--muted); padding-block: 12px; flex-wrap: wrap; }
        .plp__crumb a:hover { color: var(--bone); }
        .plp__crumb .sep { opacity: 0.5; }
        .plp__crumb .here { color: var(--bone); }
        .plp__header { display: grid; grid-template-columns: 1fr auto; gap: 32px; align-items: end; padding-block: 32px 48px; border-bottom: 1px solid var(--hair); }
        @media (max-width: 800px) { .plp__header { grid-template-columns: 1fr; gap: 16px; } }
        .plp__header .eyebrow { font-family: var(--mono); font-size: 11px; letter-spacing: 0.18em; text-transform: uppercase; color: var(--accent); }
        .plp__header h1 { font-family: var(--display); font-weight: 800; font-size: clamp(48px, 8vw, 96px); line-height: 0.9; letter-spacing: -0.02em; text-transform: uppercase; margin: 12px 0 0; }
        .plp__header h1 em { color: var(--accent); font-style: italic; }
        .plp__header p { color: var(--muted); font-size: 14px; line-height: 1.55; max-width: 540px; margin: 12px 0 0; }
        .plp__header .meta { display: flex; flex-direction: column; gap: 4px; font-family: var(--mono); font-size: 11px; letter-spacing: 0.14em; text-transform: uppercase; color: var(--muted); text-align: right; }
        @media (max-width: 800px) { .plp__header .meta { text-align: left; } }
        .plp__header .meta strong { font-family: var(--display); font-weight: 800; color: var(--bone); font-size: 28px; line-height: 1; }
        .plp__layout { display: grid; grid-template-columns: 280px 1fr; gap: 40px; margin-top: 32px; }
        @media (max-width: 900px) { .plp__layout { grid-template-columns: 1fr; gap: 24px; } .plp__sidebar { position: static; } }
        .plp__sidebar { position: sticky; top: 100px; align-self: start; display: flex; flex-direction: column; gap: 28px; }
        .plp__filter h4 { font-family: var(--mono); font-size: 10px; letter-spacing: 0.18em; text-transform: uppercase; color: var(--muted); margin: 0 0 14px; padding-bottom: 10px; border-bottom: 1px solid var(--hair); }
        .plp__filter-row { display: flex; flex-direction: column; gap: 8px; max-height: 280px; overflow-y: auto; padding-right: 4px; }
        .plp__filter-row label { display: flex; align-items: center; gap: 10px; font-size: 14px; color: var(--bone); cursor: pointer; }
        .plp__filter-row label input { accent-color: var(--accent); width: 16px; height: 16px; }
        .plp__filter-row label .count { margin-left: auto; font-family: var(--mono); font-size: 10px; color: var(--muted); letter-spacing: 0.12em; }
        .plp__pill { padding: 8px 12px; font-family: var(--mono); font-size: 11px; letter-spacing: 0.12em; text-transform: uppercase; color: var(--bone); border: 1px solid var(--hair-strong); border-radius: 4px; background: transparent; cursor: pointer; transition: all 180ms var(--ease); text-align: left; }
        .plp__pill:hover { border-color: var(--bone); }
        .plp__pill.is-on { background: var(--accent); border-color: var(--accent); color: white; }
        .plp__clear { width: 100%; padding: 12px; border: 1px solid var(--hair-strong); color: var(--bone); font-family: var(--mono); font-size: 11px; letter-spacing: 0.16em; text-transform: uppercase; cursor: pointer; transition: all 180ms var(--ease); background: transparent; border-radius: 4px; }
        .plp__clear:hover { border-color: var(--accent); color: var(--accent); }
        .plp__main-head { display: flex; justify-content: space-between; align-items: center; gap: 16px; flex-wrap: wrap; margin-bottom: 24px; padding-bottom: 18px; border-bottom: 1px solid var(--hair); }
        .plp__count { font-family: var(--mono); font-size: 12px; letter-spacing: 0.14em; text-transform: uppercase; color: var(--muted); }
        .plp__count strong { color: var(--bone); font-family: var(--display); font-weight: 800; font-size: 18px; }
        .plp__sortwrap { display: flex; align-items: center; gap: 12px; font-family: var(--mono); font-size: 11px; letter-spacing: 0.14em; text-transform: uppercase; color: var(--muted); }
        .plp__sort { background: var(--ink-2); border: 1px solid var(--hair-strong); color: var(--bone); padding: 10px 16px; font-family: var(--mono); font-size: 12px; letter-spacing: 0.08em; text-transform: uppercase; cursor: pointer; appearance: none; }
        .plp__sort:focus { outline: none; border-color: var(--accent); }
        .plp__empty { padding: 80px 0; text-align: center; }
        .plp__empty h3 { font-family: var(--display); font-weight: 800; font-size: 32px; text-transform: uppercase; margin: 0 0 12px; }
        .plp__empty p { color: var(--muted); font-size: 14px; }
        .plp__pagination { display: flex; justify-content: center; align-items: center; gap: 8px; margin-top: 48px; }
        .plp__pagination button, .plp__pagination a { width: 40px; height: 40px; display: grid; place-items: center; border: 1px solid var(--hair-strong); color: var(--bone); font-family: var(--mono); font-size: 13px; cursor: pointer; transition: all 180ms var(--ease); border-radius: 4px; text-decoration: none; }
        .plp__pagination a:hover { border-color: var(--bone); }
        .plp__pagination a.is-on { background: var(--accent); border-color: var(--accent); color: white; }
        .plp__pagination .disabled { opacity: 0.3; pointer-events: none; }
        .plp__chips { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 16px; }
        .plp__chip { display: inline-flex; align-items: center; gap: 6px; padding: 6px 10px; background: var(--accent); color: white; font-family: var(--mono); font-size: 10px; letter-spacing: 0.12em; text-transform: uppercase; border-radius: 999px; }
        .plp__chip button { background: transparent; border: 0; color: white; cursor: pointer; padding: 0; line-height: 1; }
        .plp__subcats { display: flex; flex-wrap: wrap; gap: 8px; margin: 0 0 32px; padding-bottom: 24px; border-bottom: 1px solid var(--hair); }
        .plp__subcat { display: inline-flex; align-items: center; padding: 10px 16px; background: var(--ink-2); border: 1px solid var(--hair-strong); color: var(--bone); font-family: var(--mono); font-size: 11px; letter-spacing: 0.12em; text-transform: uppercase; text-decoration: none; border-radius: 999px; transition: all 180ms var(--ease); }
        .plp__subcat:hover { border-color: var(--bone); background: var(--ink); }
      `}</style>

      <div
        className="mm-root mm-container plp"
        data-pending={pending ? "1" : "0"}
      >
        <nav className="plp__crumb">
          <Link href="/">{lang === "el" ? "Αρχική" : "Home"}</Link>
          <span className="sep">/</span>
          <span className="here">{category.name}</span>
        </nav>

        <header className="plp__header">
          <div>
            <span className="eyebrow">
              {lang === "el" ? "Κατηγορία" : "Category"}
            </span>
            <h1>
              {category.name}
              <em>.</em>
            </h1>
            {category.description && <p>{category.description}</p>}
          </div>
          <div className="meta">
            <strong>{total.toLocaleString("el-GR")}</strong>
            <span>{lang === "el" ? "Προϊόντα" : "Products"}</span>
          </div>
        </header>

        {subcategories.length > 0 && (
          <nav
            className="plp__subcats"
            aria-label={lang === "el" ? "Υποκατηγορίες" : "Subcategories"}
          >
            {subcategories.map((sc) => (
              <Link
                key={sc.slug}
                href={`/category/${sc.slug}`}
                className="plp__subcat"
              >
                {sc.name}
              </Link>
            ))}
          </nav>
        )}

        <div className="plp__layout">
          <aside className="plp__sidebar">
            {/* Brand filter from real Supabase data */}
            {filters.brands.length > 0 && (
              <div className="plp__filter">
                <h4>{lang === "el" ? "Brand" : "Brand"}</h4>
                <div className="plp__filter-row">
                  {filters.brands.map((b) => (
                    <label key={b.slug}>
                      <input
                        type="checkbox"
                        checked={initialFilters.brands.includes(b.slug)}
                        onChange={() => toggleBrand(b.slug)}
                      />
                      <span>{b.name}</span>
                      <span className="count">{b.count}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            <div className="plp__filter">
              <h4>{lang === "el" ? "Τιμή" : "Price"}</h4>
              <div className="plp__filter-row">
                {(
                  [
                    { id: "all", label: lang === "el" ? "Όλες" : "All" },
                    { id: "u50", label: "Έως €50" },
                    { id: "50-150", label: "€50 — €150" },
                    { id: "150-500", label: "€150 — €500" },
                    { id: "500+", label: "€500+" },
                  ] as const
                ).map((b) => (
                  <button
                    key={b.id}
                    className={
                      "plp__pill " + (currentBand === b.id ? "is-on" : "")
                    }
                    onClick={() => setPriceBand(b.id)}
                  >
                    {b.label}
                  </button>
                ))}
              </div>
            </div>

            {filters.certifications.length > 0 && (
              <div className="plp__filter">
                <h4>{lang === "el" ? "Πιστοποίηση" : "Certification"}</h4>
                <div className="plp__filter-row">
                  {filters.certifications.map((c) => (
                    <label key={c.value}>
                      <input type="checkbox" disabled />
                      <span>{c.value}</span>
                      <span className="count">{c.count}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {activeFilters > 0 && (
              <button className="plp__clear" onClick={clearAll}>
                {lang === "el" ? "Καθαρισμός" : "Clear all"} ({activeFilters})
              </button>
            )}
          </aside>

          <div>
            <div className="plp__main-head">
              <span className="plp__count">
                <strong>{total}</strong>{" "}
                {lang === "el" ? "προϊόντα" : "products"}
                {activeFilters > 0 &&
                  ` · ${lang === "el" ? "με φίλτρα" : "filtered"}`}
              </span>
              <div className="plp__sortwrap">
                <span>{lang === "el" ? "Ταξινόμηση" : "Sort"}</span>
                <select
                  className="plp__sort"
                  value={initialFilters.sort}
                  onChange={(e) => setParam("sort", e.target.value)}
                >
                  <option value="popular">
                    {lang === "el" ? "Δημοφιλή" : "Popular"}
                  </option>
                  <option value="newest">
                    {lang === "el" ? "Νεότερα" : "Newest"}
                  </option>
                  <option value="price_asc">
                    {lang === "el" ? "Τιμή ↑" : "Price ↑"}
                  </option>
                  <option value="price_desc">
                    {lang === "el" ? "Τιμή ↓" : "Price ↓"}
                  </option>
                  <option value="rating">
                    {lang === "el" ? "Αξιολόγηση" : "Rating"}
                  </option>
                </select>
              </div>
            </div>

            {activeFilters > 0 && (
              <div className="plp__chips">
                {initialFilters.brands.map((b) => {
                  const meta = filters.brands.find((x) => x.slug === b);
                  return (
                    <span key={b} className="plp__chip">
                      {meta?.name ?? b}
                      <button
                        onClick={() => toggleBrand(b)}
                        aria-label="Remove"
                      >
                        ✕
                      </button>
                    </span>
                  );
                })}
                {currentBand !== "all" && (
                  <span className="plp__chip">
                    {currentBand === "u50"
                      ? "≤ €50"
                      : currentBand === "50-150"
                        ? "€50 — €150"
                        : currentBand === "150-500"
                          ? "€150 — €500"
                          : "€500+"}
                    <button onClick={() => setPriceBand("all")}>✕</button>
                  </span>
                )}
              </div>
            )}

            {products.length === 0 ? (
              <div className="plp__empty">
                <h3>{lang === "el" ? "Κανένα προϊόν" : "No products"}</h3>
                <p>
                  {lang === "el"
                    ? "Δοκίμασε λιγότερα φίλτρα ή καθάρισέ τα όλα."
                    : "Try fewer filters or clear them all."}
                </p>
              </div>
            ) : (
              <div className="mm-products">
                {products.map((p) => (
                  <Link
                    key={p.id}
                    href={`/product/${p.slug}`}
                    style={{ display: "block" }}
                  >
                    <ProductCard
                      p={toCardProduct(p)}
                      t={t}
                      lang={lang}
                      onAdd={addToCart}
                      wishlist={wishlist}
                      onWish={toggleWish}
                      compare={compare}
                      onCompare={toggleCompare}
                    />
                  </Link>
                ))}
              </div>
            )}

            {totalPages > 1 && (
              <div className="plp__pagination">
                <Link
                  href={`/category/${slug}?${(() => {
                    const u = new URLSearchParams(sp?.toString() ?? "");
                    u.set("page", String(Math.max(1, page - 1)));
                    return u.toString();
                  })()}`}
                  className={page === 1 ? "disabled" : ""}
                  aria-label="Previous"
                >
                  ←
                </Link>
                {Array.from({ length: totalPages }).map((_, i) => {
                  const u = new URLSearchParams(sp?.toString() ?? "");
                  u.set("page", String(i + 1));
                  return (
                    <Link
                      key={i}
                      href={`/category/${slug}?${u.toString()}`}
                      className={page === i + 1 ? "is-on" : ""}
                    >
                      {i + 1}
                    </Link>
                  );
                })}
                <Link
                  href={`/category/${slug}?${(() => {
                    const u = new URLSearchParams(sp?.toString() ?? "");
                    u.set("page", String(Math.min(totalPages, page + 1)));
                    return u.toString();
                  })()}`}
                  className={page === totalPages ? "disabled" : ""}
                  aria-label="Next"
                >
                  →
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
