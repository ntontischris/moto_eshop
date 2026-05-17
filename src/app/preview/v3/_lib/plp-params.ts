import type { SortOption } from "@/lib/queries/products";

export interface PlpState {
  sort: SortOption;
  brands: string[];
  priceMin: number | undefined;
  priceMax: number | undefined;
  page: number;
}

type Raw = Record<string, string | string[] | undefined>;
const SORTS: SortOption[] = [
  "popular",
  "price_asc",
  "price_desc",
  "newest",
  "rating",
];

function str(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v;
}

export function parsePlpParams(sp: Raw): PlpState {
  const sortRaw = str(sp.sort);
  const sort = SORTS.includes(sortRaw as SortOption)
    ? (sortRaw as SortOption)
    : "popular";
  const brandsRaw = str(sp.brands);
  const min = str(sp.price_min);
  const max = str(sp.price_max);
  const page = Number(str(sp.page));
  return {
    sort,
    brands: brandsRaw ? brandsRaw.split(",").filter(Boolean) : [],
    priceMin: min ? Number(min) : undefined,
    priceMax: max ? Number(max) : undefined,
    page: Number.isFinite(page) && page > 0 ? page : 1,
  };
}

export function buildPlpQuery(s: PlpState): string {
  const p = new URLSearchParams();
  if (s.sort !== "popular") p.set("sort", s.sort);
  if (s.brands.length) p.set("brands", s.brands.join(","));
  if (s.priceMin != null) p.set("price_min", String(s.priceMin));
  if (s.priceMax != null) p.set("price_max", String(s.priceMax));
  if (s.page > 1) p.set("page", String(s.page));
  const q = p.toString();
  return q ? `?${q}` : "";
}
