import { categoryPath, productPath } from "./urls";

/** A single product row the command palette can render and link to. */
export interface PaletteProduct {
  id: string;
  name: string;
  brand: string;
  price: number;
  image: string;
  href: string;
}

/** A single category row the command palette can render and link to. */
export interface PaletteCategory {
  id: string;
  name: string;
  href: string;
}

/** Grouped palette results: navigation targets, kept distinct from the assistant. */
export interface PaletteResults {
  products: PaletteProduct[];
  categories: PaletteCategory[];
}

/** Minimal product shape the mapper needs — a subset of `ProductListItem`. */
export interface RawPaletteProduct {
  id: string;
  slug: string;
  name: string;
  brand: string;
  price: number;
  category_path: string | null;
  primary_image_url: string;
}

/** Minimal category shape the mapper needs. */
export interface RawPaletteCategory {
  id: string;
  name: string;
  full_path: string | null;
  slug: string;
}

/** Map a catalog product onto its Clean URL (ADR 0002). */
export function toPaletteProduct(raw: RawPaletteProduct): PaletteProduct {
  return {
    id: raw.id,
    name: raw.name,
    brand: raw.brand,
    price: raw.price,
    image: raw.primary_image_url,
    href: productPath(raw.category_path, raw.slug),
  };
}

/** Map a category onto its Clean URL (ADR 0002), preferring the full path. */
export function toPaletteCategory(raw: RawPaletteCategory): PaletteCategory {
  return {
    id: raw.id,
    name: raw.name,
    href: categoryPath(raw.full_path ?? raw.slug),
  };
}

/** Shape raw catalog rows into grouped, deep-linkable palette results. */
export function toPaletteResults(
  products: RawPaletteProduct[],
  categories: RawPaletteCategory[],
): PaletteResults {
  return {
    products: products.map(toPaletteProduct),
    categories: categories.map(toPaletteCategory),
  };
}

/** Total flattened result count, for screen-reader announcements. */
export function paletteResultCount(results: PaletteResults): number {
  return results.products.length + results.categories.length;
}
