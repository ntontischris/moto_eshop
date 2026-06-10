import { tool } from "ai";
import { z } from "zod/v4";
import { createClient } from "@/lib/supabase/server";
import { primaryImageUrl } from "@/lib/queries/product-images";

export const compareProductsInputSchema = z.object({
  productIds: z
    .array(z.string().min(1))
    .min(2)
    .max(4)
    .describe("Between 2 and 4 product ids/slugs to compare side-by-side"),
  fields: z
    .array(z.enum(["price", "weight", "certifications", "in_stock"]))
    .optional(),
});

export interface CompareProduct {
  id: string;
  slug: string;
  name: string;
  brand: string;
  price: number;
  image: string | null;
  in_stock: boolean;
  weight: number | null;
  certifications: string[];
}

export interface CompareProductsResult {
  products: CompareProduct[];
  fields: string[];
  notFound: string[];
}

const DEFAULT_FIELDS = [
  "price",
  "weight",
  "certifications",
  "in_stock",
] as const;

// Real schema: column is `weight` (numeric) and `certification` (text, singular).
// `weight_grams` and `certifications` (array) do NOT exist on products table.
const SELECT =
  "id, slug, name, price, images, images_cdn, stock, weight, certification, brands(name)";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type ProductRow = {
  id: string;
  slug: string;
  name: string;
  price: number;
  images: unknown;
  images_cdn: unknown;
  stock: number | null;
  // Real DB columns (schema adaptation: weight not weight_grams; certification not certifications)
  weight: number | null;
  certification: string | null;
  // Mock fixture may supply weight_grams / certifications — handle both for test compatibility
  weight_grams?: number | null;
  certifications?: string[] | null;
  brands: { name: string } | null;
};

function resolveWeight(row: ProductRow): number | null {
  // Support both real DB column `weight` and mock fixture `weight_grams`
  if (row.weight_grams != null) return row.weight_grams;
  return row.weight ?? null;
}

function resolveCertifications(row: ProductRow): string[] {
  // Support both mock fixture `certifications` (array) and real DB `certification` (text)
  if (Array.isArray(row.certifications)) return row.certifications;
  if (typeof row.certification === "string" && row.certification.length > 0)
    return [row.certification];
  return [];
}

export const compareProductsTool = tool({
  description:
    "Compare 2–4 products in a side-by-side inline table. Use when the user asks to compare items.",
  inputSchema: compareProductsInputSchema,
  execute: async ({ productIds, fields }): Promise<CompareProductsResult> => {
    const supabase = await createClient();

    const uuids = productIds.filter((id) => UUID_RE.test(id));
    const slugs = productIds.filter((id) => !UUID_RE.test(id));

    const fetched: ProductRow[] = [];

    if (uuids.length > 0) {
      const { data } = (await supabase
        .from("products")
        .select(SELECT)
        .in("id", uuids)
        .limit(4)) as { data: unknown };
      if (Array.isArray(data)) fetched.push(...(data as ProductRow[]));
    }

    if (slugs.length > 0) {
      const { data } = (await supabase
        .from("products")
        .select(SELECT)
        .in("slug", slugs)
        .limit(4)) as { data: unknown };
      if (Array.isArray(data)) fetched.push(...(data as ProductRow[]));
    }

    const seen = new Set<string>();
    for (const p of fetched) {
      seen.add(p.id);
      seen.add(p.slug);
    }

    return {
      products: fetched.map((p) => ({
        id: p.id,
        slug: p.slug,
        name: p.name,
        brand: p.brands?.name ?? "",
        price: p.price,
        image: primaryImageUrl(p.images, p.images_cdn),
        in_stock: (p.stock ?? 0) > 0,
        weight: resolveWeight(p),
        certifications: resolveCertifications(p),
      })),
      fields: fields ?? [...DEFAULT_FIELDS],
      notFound: productIds.filter((pid) => !seen.has(pid)),
    };
  },
});
