"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Meilisearch } from "meilisearch";
import { Search, X, Clock, Tag } from "lucide-react";
import { cn } from "@/lib/utils";
import { VoiceSearchButton } from "./voice-search-button";
import type { SearchHit } from "@/lib/meilisearch/types";

const client = new Meilisearch({
  host: process.env.NEXT_PUBLIC_MEILI_HOST ?? "",
  apiKey: process.env.NEXT_PUBLIC_MEILI_SEARCH_KEY ?? "",
});

const RECENT_KEY = "mm_recent_searches";
const MAX_RECENT = 5;
const DEBOUNCE_MS = 150;

function getRecentSearches(): string[] {
  try {
    return JSON.parse(localStorage.getItem(RECENT_KEY) ?? "[]");
  } catch {
    return [];
  }
}

function saveRecentSearch(query: string): void {
  const existing = getRecentSearches().filter((s) => s !== query);
  const updated = [query, ...existing].slice(0, MAX_RECENT);
  localStorage.setItem(RECENT_KEY, JSON.stringify(updated));
}

interface SearchResult {
  products: SearchHit[];
  categories: { slug: string; name: string; count: number }[];
}

interface SearchDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SearchDialog({ isOpen, onClose }: SearchDialogProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (isOpen) {
      setRecentSearches(getRecentSearches());
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery("");
      setResults(null);
      setActiveIndex(-1);
    }
  }, [isOpen]);

  const search = useCallback(async (q: string) => {
    if (!q.trim()) {
      setResults(null);
      return;
    }
    setIsLoading(true);
    try {
      const { results: meiliResults } = await client.multiSearch({
        queries: [
          {
            indexUid: "products",
            q,
            limit: 6,
            attributesToHighlight: ["name", "brand"],
            highlightPreTag:
              '<mark class="bg-yellow-100 text-yellow-900 rounded-sm">',
            highlightPostTag: "</mark>",
            facets: ["category_slug"],
          },
        ],
      });

      const productResult = meiliResults[0];
      const categoryFacets =
        productResult.facetDistribution?.category_slug ?? {};

      setResults({
        products: productResult.hits as SearchHit[],
        categories: Object.entries(categoryFacets)
          .slice(0, 4)
          .map(([slug, count]) => ({
            slug,
            name: slug,
            count: count as number,
          })),
      });
    } catch (err) {
      console.error("[SearchDialog]", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(query), DEBOUNCE_MS);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, search]);

  const handleSubmit = () => {
    if (!query.trim()) return;
    saveRecentSearch(query.trim());
    router.push(`/search?q=${encodeURIComponent(query.trim())}`);
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") return handleSubmit();
    if (e.key === "Escape") return onClose();
    if (e.key === "ArrowDown") setActiveIndex((i) => i + 1);
    if (e.key === "ArrowUp") setActiveIndex((i) => Math.max(-1, i - 1));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col sm:items-center sm:pt-20">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden
      />

      <div className="relative flex max-h-screen w-full flex-col overflow-hidden bg-white shadow-2xl dark:bg-zinc-900 sm:max-h-[70vh] sm:max-w-2xl sm:rounded-2xl">
        <div className="flex items-center gap-3 border-b border-zinc-200 px-4 py-3 dark:border-zinc-700">
          <Search className="size-5 shrink-0 text-zinc-400" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Αναζήτηση προϊόντος, μάρκας..."
            className="flex-1 bg-transparent text-base outline-none placeholder:text-zinc-400"
          />
          <VoiceSearchButton onResult={(t) => setQuery(t)} />
          {query && (
            <button onClick={() => setQuery("")} aria-label="Καθαρισμός">
              <X className="size-4 text-zinc-400" />
            </button>
          )}
          <kbd className="hidden items-center gap-1 rounded border border-zinc-200 px-2 py-0.5 text-xs text-zinc-500 dark:border-zinc-700 sm:inline-flex">
            Esc
          </kbd>
        </div>

        <div className="overflow-y-auto overscroll-contain">
          {!query && recentSearches.length > 0 && (
            <Section title="Πρόσφατες αναζητήσεις">
              {recentSearches.map((s) => (
                <button
                  key={s}
                  className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm hover:bg-zinc-50 dark:hover:bg-zinc-800"
                  onClick={() => setQuery(s)}
                >
                  <Clock className="size-4 shrink-0 text-zinc-400" />
                  {s}
                </button>
              ))}
            </Section>
          )}

          {results?.categories && results.categories.length > 0 && (
            <Section title="Κατηγορίες">
              {results.categories.map((cat) => (
                <button
                  key={cat.slug}
                  className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm hover:bg-zinc-50 dark:hover:bg-zinc-800"
                  onClick={() => {
                    router.push(`/${cat.slug}`);
                    onClose();
                  }}
                >
                  <Tag className="size-4 shrink-0 text-zinc-400" />
                  <span className="flex-1">{cat.name}</span>
                  <span className="text-zinc-400">{cat.count}</span>
                </button>
              ))}
            </Section>
          )}

          {results?.products && results.products.length > 0 && (
            <Section title="Προϊόντα">
              {results.products.map((hit, i) => (
                <ProductHitRow
                  key={hit.id}
                  hit={hit}
                  isActive={activeIndex === i}
                  onClick={() => {
                    saveRecentSearch(query);
                    router.push(`/${hit.category_slug}/${hit.slug}`);
                    onClose();
                  }}
                />
              ))}
            </Section>
          )}

          {query && results?.products.length === 0 && !isLoading && (
            <div className="px-4 py-10 text-center text-sm text-zinc-500">
              Δεν βρέθηκαν αποτελέσματα για{" "}
              <span className="font-medium text-zinc-900 dark:text-white">
                &quot;{query}&quot;
              </span>
            </div>
          )}

          {query && (results?.products ?? []).length > 0 && (
            <button
              className="w-full border-t border-zinc-100 px-4 py-3 text-center text-sm text-blue-600 hover:bg-zinc-50 dark:border-zinc-800 dark:text-blue-400 dark:hover:bg-zinc-800"
              onClick={handleSubmit}
            >
              Εμφάνιση όλων των αποτελεσμάτων για &quot;{query}&quot;
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className="px-4 py-2 text-xs font-semibold uppercase tracking-wide text-zinc-400">
        {title}
      </p>
      {children}
    </div>
  );
}

function ProductHitRow({
  hit,
  isActive,
  onClick,
}: {
  hit: SearchHit;
  isActive: boolean;
  onClick: () => void;
}) {
  const name = hit._formatted?.name ?? hit.name;
  return (
    <button
      className={cn(
        "flex w-full items-center gap-3 px-4 py-2.5 text-left",
        isActive
          ? "bg-zinc-100 dark:bg-zinc-800"
          : "hover:bg-zinc-50 dark:hover:bg-zinc-800/60",
      )}
      onClick={onClick}
    >
      {hit.primary_image_url && (
        <div className="size-10 shrink-0 overflow-hidden rounded-md bg-zinc-100">
          <Image
            src={hit.primary_image_url}
            alt={hit.primary_image_alt}
            width={40}
            height={40}
            className="size-full object-cover"
          />
        </div>
      )}
      <div className="min-w-0 flex-1">
        <p
          className="truncate text-sm font-medium text-zinc-900 dark:text-white"
          dangerouslySetInnerHTML={{ __html: name }}
        />
        <p className="text-xs text-zinc-500">{hit.brand}</p>
      </div>
      <p className="shrink-0 text-sm font-semibold text-zinc-900 dark:text-white">
        {new Intl.NumberFormat("el-GR", {
          style: "currency",
          currency: "EUR",
        }).format(hit.price)}
      </p>
    </button>
  );
}
