"use server";

import { z } from "zod/v4";
import { createClient } from "@/lib/supabase/server";

type ActionResult = { success: true } | { success: false; error: string };

const CreateAlertSchema = z.object({
  productId: z.string().uuid(),
  email: z.email("Εισάγετε έγκυρο email"),
  targetPrice: z.number().positive(),
});

export async function createPriceAlert(
  input: z.infer<typeof CreateAlertSchema>,
): Promise<ActionResult> {
  const parsed = CreateAlertSchema.safeParse(input);
  if (!parsed.success)
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Σφάλμα",
    };

  const supabase = await createClient();

  // Check duplicate
  const { data: existing } = await supabase
    .from("price_alerts")
    .select("id")
    .eq("product_id", parsed.data.productId)
    .eq("email", parsed.data.email)
    .eq("is_active", true)
    .maybeSingle();

  if (existing) return { success: true };

  const { error } = await supabase.from("price_alerts").insert({
    product_id: parsed.data.productId,
    email: parsed.data.email,
    target_price: parsed.data.targetPrice,
    is_active: true,
  });

  if (error)
    return { success: false, error: "Αποτυχία δημιουργίας ειδοποίησης" };
  return { success: true };
}
