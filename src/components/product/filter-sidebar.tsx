"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useCallback, useState } from "react";
import { SlidersHorizontal, X, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { RatingStars } from "@/components/ui/rating-stars";
import type { ProductFilters } from "@/lib/queries/products";

interface FilterSidebarProps {
  filters: ProductFilters;
}

interface FilterSectionProps {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

function FilterSection({
  title,
  children,
  defaultOpen = true,
}: FilterSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  return (
    <div className="border-b py-4">
      <button
        type="button"
        className="flex w-full items-center justify-between text-sm font-semibold"
        onClick={() => setIsOpen((prev) => !prev)}
      >
        {title}
        {isOpen ? (
          <ChevronUp className="h-4 w-4" />
        ) : (
          <ChevronDown className="h-4 w-4" />
        )}
      </button>
      {isOpen && <div className="mt-3 space-y-2">{children}</div>}
    </div>
  );
}

function FilterContent({ filters }: FilterSidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const selectedBrands = searchParams.getAll("brand");
  const selectedCerts = searchParams.getAll("cert");
  const selectedRiders = searchParams.getAll("rider");
  const priceMinParam = searchParams.get("price_min") ?? "";
  const priceMaxParam = searchParams.get("price_max") ?? "";
  const minRatingParam = searchParams.get("min_rating") ?? "";

  const [priceMin, setPriceMin] = useState(priceMinParam);
  const [priceMax, setPriceMax] = useState(priceMaxParam);

  const pushParams = useCallback(
    (updater: (params: URLSearchParams) => void) => {
      const params = new URLSearchParams(searchParams.toString());
      updater(params);
      params.delete("page");
      const qs = params.toString();
      router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [router, pathname, searchParams],
  );

  const toggleMulti = useCallback(
    (key: string, value: string, current: string[]) => {
      pushParams((params) => {
        params.delete(key);
        const next = current.includes(value)
          ? current.filter((v) => v !== value)
          : [...current, value];
        for (const v of next) params.append(key, v);
      });
    },
    [pushParams],
  );

  const applyPriceRange = useCallback(() => {
    pushParams((params) => {
      if (priceMin) {
        params.set("price_min", priceMin);
      } else {
        params.delete("price_min");
      }
      if (priceMax) {
        params.set("price_max", priceMax);
      } else {
        params.delete("price_max");
      }
    });
  }, [pushParams, priceMin, priceMax]);

  const setRatingFilter = useCallback(
    (threshold: number) => {
      pushParams((params) => {
        const current = params.get("min_rating");
        if (current === String(threshold)) {
          params.delete("min_rating");
        } else {
          params.set("min_rating", String(threshold));
        }
      });
    },
    [pushParams],
  );

  const clearAllFilters = useCallback(() => {
    router.push(pathname, { scroll: false });
  }, [router, pathname]);

  const hasActiveFilters =
    selectedBrands.length > 0 ||
    selectedCerts.length > 0 ||
    selectedRiders.length > 0 ||
    priceMinParam !== "" ||
    priceMaxParam !== "" ||
    minRatingParam !== "";

  return (
    <div className="space-y-0">
      {hasActiveFilters && (
        <div className="flex items-center justify-between border-b pb-3">
          <span className="text-sm font-medium">Ενεργά φίλτρα</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={clearAllFilters}
            className="h-auto px-2 py-1 text-xs"
          >
            <X className="mr-1 h-3 w-3" />
            Καθαρισμός
          </Button>
        </div>
      )}

      {filters.brands.length > 0 && (
        <FilterSection title="Μάρκα">
          {filters.brands.map((brand) => (
            <label
              key={brand.slug}
              className="flex cursor-pointer items-center gap-2 text-sm"
            >
              <Checkbox
                checked={selectedBrands.includes(brand.slug)}
                onCheckedChange={() =>
                  toggleMulti("brand", brand.slug, selectedBrands)
                }
              />
              <span className="flex-1">{brand.name}</span>
              <span className="text-xs text-muted-foreground">
                ({brand.count})
              </span>
            </label>
          ))}
        </FilterSection>
      )}

      <FilterSection title="Τιμή">
        <div className="flex items-center gap-2">
          <Input
            type="number"
            placeholder={`${filters.price_range.min}`}
            value={priceMin}
            onChange={(e) => setPriceMin(e.target.value)}
            className="h-8 text-sm"
            min={0}
          />
          <span className="shrink-0 text-muted-foreground">–</span>
          <Input
            type="number"
            placeholder={`${filters.price_range.max}`}
            value={priceMax}
            onChange={(e) => setPriceMax(e.target.value)}
            className="h-8 text-sm"
            min={0}
          />
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={applyPriceRange}
          className="mt-2 w-full"
        >
          Εφαρμογή
        </Button>
      </FilterSection>

      {filters.certifications.length > 0 && (
        <FilterSection title="Πιστοποίηση">
          {filters.certifications.map((cert) => (
            <label
              key={cert.value}
              className="flex cursor-pointer items-center gap-2 text-sm"
            >
              <Checkbox
                checked={selectedCerts.includes(cert.value)}
                onCheckedChange={() =>
                  toggleMulti("cert", cert.value, selectedCerts)
                }
              />
              <span className="flex-1">{cert.value}</span>
              <span className="text-xs text-muted-foreground">
                ({cert.count})
              </span>
            </label>
          ))}
        </FilterSection>
      )}

      {filters.rider_types.length > 0 && (
        <FilterSection title="Τύπος αναβάτη">
          {filters.rider_types.map((rider) => (
            <label
              key={rider.value}
              className="flex cursor-pointer items-center gap-2 text-sm"
            >
              <Checkbox
                checked={selectedRiders.includes(rider.value)}
                onCheckedChange={() =>
                  toggleMulti("rider", rider.value, selectedRiders)
                }
              />
              <span className="flex-1 capitalize">{rider.value}</span>
              <span className="text-xs text-muted-foreground">
                ({rider.count})
              </span>
            </label>
          ))}
        </FilterSection>
      )}

      {filters.rating_buckets.length > 0 && (
        <FilterSection title="Αξιολόγηση">
          {filters.rating_buckets.map((bucket) => (
            <button
              key={bucket.min}
              type="button"
              onClick={() => setRatingFilter(bucket.min)}
              className={`flex w-full items-center justify-between rounded-md px-2 py-1 text-sm transition-colors ${
                minRatingParam === String(bucket.min)
                  ? "bg-primary/10 font-medium text-primary"
                  : "hover:bg-accent"
              }`}
            >
              <div className="flex items-center gap-1">
                <RatingStars rating={bucket.min} size="sm" />
                <span>& άνω</span>
              </div>
              <span className="text-xs text-muted-foreground">
                ({bucket.count})
              </span>
            </button>
          ))}
        </FilterSection>
      )}
    </div>
  );
}

export function FilterSidebar({ filters }: FilterSidebarProps) {
  return (
    <>
      <aside className="hidden w-64 shrink-0 lg:block">
        <h2 className="mb-4 text-lg font-semibold">Φίλτρα</h2>
        <FilterContent filters={filters} />
      </aside>
      <div className="lg:hidden">
        <Sheet>
          <SheetTrigger
            render={
              <Button variant="outline" size="sm" className="gap-2">
                <SlidersHorizontal className="h-4 w-4" />
                Φίλτρα
              </Button>
            }
          />
          <SheetContent side="left" className="w-80 overflow-y-auto">
            <SheetHeader>
              <SheetTitle>Φίλτρα</SheetTitle>
            </SheetHeader>
            <div className="mt-4">
              <FilterContent filters={filters} />
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
}
