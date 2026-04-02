import { createAdminClient } from "@/lib/supabase/admin";

export interface PricePoint {
  price: number;
  recorded_at: string;
}

export async function getPriceHistory(
  productId: string,
  days: 30 | 90 | 180 = 90,
): Promise<PricePoint[]> {
  const supabase = createAdminClient();
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

  const { data } = await supabase
    .from("price_history" as "products")
    .select("price, recorded_at")
    .eq("product_id" as "id", productId)
    .gte("recorded_at" as "created_at", since)
    .order("recorded_at" as "created_at", { ascending: true });

  return (data ?? []) as unknown as PricePoint[];
}
