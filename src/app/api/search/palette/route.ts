import { NextResponse } from "next/server";
import { hasLocale, defaultLocale, type Locale } from "@/i18n/config";
import { searchProducts } from "@/lib/queries/products";
import { searchCategories } from "@/lib/queries/categories";
import {
  toPaletteResults,
  type PaletteResults,
} from "@/app/[locale]/(store)/_lib/palette-search";

const PRODUCT_LIMIT = 6;
const CATEGORY_LIMIT = 5;

/**
 * Instant search for the ⌘K command palette. Returns products + categories
 * already mapped to their Clean URLs (ADR 0002). Reuses the catalog search
 * (Meili with Supabase fallback) — it does not invent a new index.
 */
export async function GET(
  request: Request,
): Promise<NextResponse<PaletteResults>> {
  const url = new URL(request.url);
  const q = (url.searchParams.get("q") ?? "").trim();
  const localeParam = url.searchParams.get("locale") ?? "";
  const locale: Locale = hasLocale(localeParam) ? localeParam : defaultLocale;

  if (q.length < 2) {
    return NextResponse.json({ products: [], categories: [] });
  }

  const [productResult, categories] = await Promise.all([
    searchProducts(q, 1, PRODUCT_LIMIT, locale),
    searchCategories(q, CATEGORY_LIMIT, locale),
  ]);

  return NextResponse.json(toPaletteResults(productResult.data, categories));
}
