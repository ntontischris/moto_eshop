"use server";

import { z } from "zod/v4";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

type ActionResult =
  | { success: true; wishlisted?: boolean }
  | { success: false; error: string };

export async function toggleWishlist(productId: string): Promise<ActionResult> {
  const parsed = z.string().uuid().safeParse(productId);
  if (!parsed.success) return { success: false, error: "Invalid product ID" };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Απαιτείται σύνδεση" };

  const { data: existing } = await supabase
    .from("wishlists")
    .select("id")
    .eq("user_id", user.id)
    .eq("product_id", parsed.data)
    .maybeSingle();

  if (existing) {
    await supabase.from("wishlists").delete().eq("id", existing.id);
    revalidatePath("/wishlist");
    return { success: true, wishlisted: false };
  }

  const { error } = await supabase
    .from("wishlists")
    .insert({ user_id: user.id, product_id: parsed.data });

  if (error) return { success: false, error: "Αποτυχία" };
  revalidatePath("/wishlist");
  return { success: true, wishlisted: true };
}

export async function clearWishlist(): Promise<
  { success: true } | { success: false; error: string }
> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Απαιτείται σύνδεση" };

  await supabase.from("wishlists").delete().eq("user_id", user.id);
  revalidatePath("/wishlist");
  return { success: true };
}
