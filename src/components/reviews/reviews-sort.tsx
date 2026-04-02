"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import type { ReviewSort } from "@/lib/queries/reviews";

const SORT_OPTIONS: { value: ReviewSort; label: string }[] = [
  { value: "recent", label: "Πρόσφατα" },
  { value: "highest", label: "Υψηλότερη" },
  { value: "lowest", label: "Χαμηλότερη" },
];

export function ReviewsSort() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const current = (searchParams.get("reviewSort") ?? "recent") as ReviewSort;

  function setSort(value: ReviewSort) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("reviewSort", value);
    params.delete("reviewPage");
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }

  return (
    <div className="flex flex-wrap gap-2">
      {SORT_OPTIONS.map(({ value, label }) => (
        <Button
          key={value}
          variant={current === value ? "default" : "outline"}
          size="sm"
          onClick={() => setSort(value)}
        >
          {label}
        </Button>
      ))}
    </div>
  );
}
