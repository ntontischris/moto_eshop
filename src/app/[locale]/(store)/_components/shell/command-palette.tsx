"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { Search, X, Tag } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { SmartImage } from "../commerce/smart-image";
import { formatPrice } from "../../_lib/format";
import {
  paletteResultCount,
  type PaletteResults,
} from "../../_lib/palette-search";

const DEBOUNCE_MS = 180;
const MIN_QUERY = 2;

const EMPTY: PaletteResults = { products: [], categories: [] };

/** Flat, ordered list of every result's href — drives arrow-key navigation. */
function flattenHrefs(results: PaletteResults): string[] {
  return [
    ...results.categories.map((c) => c.href),
    ...results.products.map((p) => p.href),
  ];
}

export function CommandPalette({ onClose }: { onClose: () => void }) {
  const t = useTranslations("palette");
  const router = useRouter();
  const locale = useLocale();
  const inputRef = useRef<HTMLInputElement>(null);
  const listboxId = useId();

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<PaletteResults>(EMPTY);
  const [isLoading, setIsLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  const hrefs = useMemo(() => flattenHrefs(results), [results]);
  const count = paletteResultCount(results);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Debounced fetch against the lazy palette search endpoint.
  useEffect(() => {
    const term = query.trim();
    if (term.length < MIN_QUERY) {
      setResults(EMPTY);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/search/palette?q=${encodeURIComponent(term)}&locale=${locale}`,
          { signal: controller.signal },
        );
        if (!res.ok) return;
        const data = (await res.json()) as PaletteResults;
        setResults(data);
        setActiveIndex(0);
      } catch {
        // Aborted or network error — keep the previous results.
      } finally {
        setIsLoading(false);
      }
    }, DEBOUNCE_MS);
    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [query, locale]);

  function go(href: string) {
    router.push(href);
    onClose();
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Escape") {
      e.preventDefault();
      onClose();
      return;
    }
    if (hrefs.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => (i + 1) % hrefs.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => (i - 1 + hrefs.length) % hrefs.length);
    } else if (e.key === "Enter") {
      e.preventDefault();
      const href = hrefs[activeIndex];
      if (href) go(href);
    }
  }

  // Map a group-local index to the flattened active index (categories first).
  const categoryBase = 0;
  const productBase = results.categories.length;
  const showEmpty =
    query.trim().length >= MIN_QUERY && count === 0 && !isLoading;

  return (
    <div
      className="v3-cmdk"
      role="dialog"
      aria-modal="true"
      aria-label={t("title")}
    >
      <button
        type="button"
        className="v3-cmdk-scrim"
        aria-label={t("close")}
        onClick={onClose}
      />

      <div className="v3-cmdk-panel">
        <div className="v3-cmdk-search">
          <Search
            className="v3-cmdk-search-icon"
            size={18}
            aria-hidden="true"
          />
          <input
            ref={inputRef}
            type="text"
            role="combobox"
            aria-expanded={count > 0}
            aria-controls={listboxId}
            aria-autocomplete="list"
            aria-label={t("inputLabel")}
            className="v3-cmdk-input"
            placeholder={t("placeholder")}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onKeyDown}
            autoComplete="off"
            spellCheck={false}
          />
          {query && (
            <button
              type="button"
              className="v3-cmdk-clear"
              aria-label={t("clear")}
              onClick={() => {
                setQuery("");
                inputRef.current?.focus();
              }}
            >
              <X size={16} aria-hidden="true" />
            </button>
          )}
          <kbd className="v3-cmdk-esc">Esc</kbd>
        </div>

        <p className="v3-sr-only" role="status" aria-live="polite">
          {query.trim().length >= MIN_QUERY ? t("resultsCount", { count }) : ""}
        </p>

        <ul className="v3-cmdk-results" id={listboxId} role="listbox">
          {results.categories.length > 0 && (
            <li role="presentation">
              <p className="v3-cmdk-group">{t("categories")}</p>
              <ul role="presentation">
                {results.categories.map((cat, i) => {
                  const index = categoryBase + i;
                  return (
                    <li
                      key={cat.id}
                      role="option"
                      aria-selected={activeIndex === index}
                    >
                      <button
                        type="button"
                        className="v3-cmdk-row"
                        data-active={activeIndex === index || undefined}
                        onMouseEnter={() => setActiveIndex(index)}
                        onClick={() => go(cat.href)}
                      >
                        <span className="v3-cmdk-cat-icon" aria-hidden="true">
                          <Tag size={16} />
                        </span>
                        <span className="v3-cmdk-row-name">{cat.name}</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </li>
          )}

          {results.products.length > 0 && (
            <li role="presentation">
              <p className="v3-cmdk-group">{t("products")}</p>
              <ul role="presentation">
                {results.products.map((p, i) => {
                  const index = productBase + i;
                  return (
                    <li
                      key={p.id}
                      role="option"
                      aria-selected={activeIndex === index}
                    >
                      <button
                        type="button"
                        className="v3-cmdk-row"
                        data-active={activeIndex === index || undefined}
                        onMouseEnter={() => setActiveIndex(index)}
                        onClick={() => go(p.href)}
                      >
                        <span className="v3-cmdk-thumb">
                          <SmartImage src={p.image} alt={p.name} sizes="44px" />
                        </span>
                        <span className="v3-cmdk-row-body">
                          <span className="v3-cmdk-row-name">{p.name}</span>
                          {p.brand && (
                            <span className="v3-cmdk-row-brand">{p.brand}</span>
                          )}
                        </span>
                        <span className="v3-cmdk-row-price">
                          {formatPrice(p.price)}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </li>
          )}

          {showEmpty && (
            <li role="presentation" className="v3-cmdk-empty">
              {t("noResults", { q: query.trim() })}
            </li>
          )}

          {query.trim().length < MIN_QUERY && (
            <li role="presentation" className="v3-cmdk-hint">
              {t("hint")}
            </li>
          )}
        </ul>
      </div>
    </div>
  );
}
