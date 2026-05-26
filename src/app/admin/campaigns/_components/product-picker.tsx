"use client";

import { useEffect, useState, useTransition } from "react";
import { Search, X } from "lucide-react";
import {
  searchProductsForPicker,
  getPickerProducts,
  type PickerProduct,
} from "@/lib/actions/campaigns";

export function ProductPicker({
  value,
  onChange,
}: {
  value: string[];
  onChange: (ids: string[]) => void;
}) {
  const [selected, setSelected] = useState<PickerProduct[]>([]);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<PickerProduct[]>([]);
  const [pending, start] = useTransition();

  // Resolve ids → product details for the chips (initial load + external edits).
  useEffect(() => {
    const haveAll = value.every((id) => selected.some((s) => s.id === id));
    if (value.length > 0 && !haveAll) {
      getPickerProducts(value).then(setSelected);
    }
    if (value.length === 0 && selected.length > 0) setSelected([]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value.join(",")]);

  function runSearch() {
    start(async () => setResults(await searchProductsForPicker(query)));
  }

  function add(p: PickerProduct) {
    if (value.includes(p.id)) return;
    onChange([...value, p.id]);
    setSelected((s) => [...s, p]);
  }

  function remove(id: string) {
    onChange(value.filter((i) => i !== id));
    setSelected((s) => s.filter((p) => p.id !== id));
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {selected.map((p) => (
          <span
            key={p.id}
            className="flex items-center gap-1 rounded-full bg-bg-elevated px-2 py-1 text-xs text-text-primary"
          >
            {p.name}
            <button
              type="button"
              onClick={() => remove(p.id)}
              className="text-text-muted hover:text-red-400"
            >
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}
        {selected.length === 0 && (
          <span className="text-xs text-text-muted">
            Κανένα προϊόν επιλεγμένο
          </span>
        )}
      </div>

      <div className="flex gap-2">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              runSearch();
            }
          }}
          placeholder="Αναζήτηση προϊόντος..."
          className="flex-1 rounded-lg border border-border-default bg-bg-elevated px-3 py-2 text-sm text-text-primary placeholder:text-text-muted"
        />
        <button
          type="button"
          onClick={runSearch}
          disabled={pending}
          className="flex items-center gap-1 rounded-lg bg-bg-elevated px-3 py-2 text-sm text-text-secondary hover:text-text-primary"
        >
          <Search className="h-4 w-4" />
        </button>
      </div>

      {results.length > 0 && (
        <ul className="max-h-48 overflow-y-auto rounded-lg border border-border-default bg-bg-surface">
          {results.map((p) => (
            <li key={p.id}>
              <button
                type="button"
                onClick={() => add(p)}
                disabled={value.includes(p.id)}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-text-secondary hover:bg-bg-elevated disabled:opacity-40"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {p.image && (
                  <img
                    src={p.image}
                    alt=""
                    className="h-8 w-8 rounded object-contain"
                  />
                )}
                <span className="flex-1">{p.name}</span>
                <span className="text-xs text-text-muted">{p.brand}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
