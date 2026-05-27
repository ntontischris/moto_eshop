import { tool } from "ai";
import { z } from "zod/v4";

const filterShape = z
  .object({
    color: z.string().min(1).optional(),
    brand: z.string().min(1).optional(),
    category: z.string().min(1).optional(),
    size: z.string().min(1).optional(),
    priceMin: z.number().nonnegative().optional(),
    priceMax: z.number().nonnegative().optional(),
  })
  .refine(
    (f) =>
      f.color !== undefined ||
      f.brand !== undefined ||
      f.category !== undefined ||
      f.size !== undefined ||
      f.priceMin !== undefined ||
      f.priceMax !== undefined,
    { message: "at least one filter is required" },
  );

export const applyFiltersInputSchema = z.object({
  filters: filterShape,
});

export type ChatFilters = z.infer<typeof filterShape>;

const NUMERIC_KEYS: Record<string, string> = {
  priceMin: "price_min",
  priceMax: "price_max",
};

export function buildFilterSearchParams(filters: ChatFilters): URLSearchParams {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(filters)) {
    if (v === undefined || v === null || v === "") continue;
    const key = NUMERIC_KEYS[k] ?? k;
    p.set(key, String(v));
  }
  return p;
}

export function isFilterContextAllowed(pathname: string): boolean {
  const stripped = pathname.replace(/^\/[a-z]{2}(?=\/|$)/, "");
  return stripped.startsWith("/category/");
}

/**
 * Client-side tool — no execute defined.
 * Browser's useChat({ onToolCall }) executes it by updating URL search params.
 */
export const applyFiltersTool = tool({
  description:
    "Apply filters (color, brand, category, size, price range) on the current product list page. Only works on /category/* routes. If the user is not on a PLP, call navigateTo first to take them to a category.",
  inputSchema: applyFiltersInputSchema,
});
