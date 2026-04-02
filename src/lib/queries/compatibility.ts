import { createClient } from "@/lib/supabase/server";

export async function getProductCompatibility(
  productId: string,
  bikeId: string,
): Promise<boolean> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("product_compatibility")
    .select("id")
    .eq("product_id", productId)
    .eq("bike_id", bikeId)
    .maybeSingle();

  return data !== null;
}

export async function getCompatibleProductIds(
  bikeId: string,
): Promise<string[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("product_compatibility")
    .select("product_id")
    .eq("bike_id", bikeId);

  return (data ?? []).map((r) => r.product_id);
}
