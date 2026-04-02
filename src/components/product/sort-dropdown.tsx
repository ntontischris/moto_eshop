"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useCallback } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const SORT_OPTIONS = [
  { value: "popular", label: "Δημοφιλή" },
  { value: "price_asc", label: "Τιμή ↑" },
  { value: "price_desc", label: "Τιμή ↓" },
  { value: "newest", label: "Νέα" },
  { value: "rating", label: "Αξιολόγηση" },
] as const;

export function SortDropdown() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentSort = searchParams.get("sort") ?? "popular";

  const handleSortChange = useCallback(
    (value: string | null) => {
      if (!value) return;
      const params = new URLSearchParams(searchParams.toString());
      if (value === "popular") {
        params.delete("sort");
      } else {
        params.set("sort", value);
      }
      params.delete("page");
      const qs = params.toString();
      router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [router, pathname, searchParams],
  );

  return (
    <div className="flex items-center gap-2">
      <label
        htmlFor="sort-select"
        className="whitespace-nowrap text-sm text-muted-foreground"
      >
        Ταξινόμηση:
      </label>
      <Select value={currentSort} onValueChange={handleSortChange}>
        <SelectTrigger id="sort-select" className="w-[180px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {SORT_OPTIONS.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
