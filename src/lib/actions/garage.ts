"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod/v4";
import { createClient } from "@/lib/supabase/server";

type ActionResult = { success: true } | { success: false; error: string };

const AddBikeSchema = z.object({
  bikeId: z.string().uuid(),
});

const RemoveBikeSchema = z.object({
  userBikeId: z.string().uuid(),
});

const SetPrimarySchema = z.object({
  userBikeId: z.string().uuid(),
});

export async function addBike(input: unknown): Promise<ActionResult> {
  const parsed = AddBikeSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: "Invalid bike ID" };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return {
      success: false,
      error: "Πρέπει να συνδεθείς για να προσθέσεις μηχανή",
    };

  const { error } = await supabase
    .from("user_bikes")
    .insert({
      user_id: user.id,
      bike_id: parsed.data.bikeId,
      is_primary: false,
    });

  if (error) return { success: false, error: "Αποτυχία προσθήκης μηχανής" };

  revalidatePath("/garage");
  return { success: true };
}

export async function removeBike(input: unknown): Promise<ActionResult> {
  const parsed = RemoveBikeSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: "Invalid ID" };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Unauthorized" };

  const { error } = await supabase
    .from("user_bikes")
    .delete()
    .eq("id", parsed.data.userBikeId)
    .eq("user_id", user.id);

  if (error) return { success: false, error: "Αποτυχία διαγραφής μηχανής" };

  revalidatePath("/garage");
  return { success: true };
}

export async function setPrimaryBike(input: unknown): Promise<ActionResult> {
  const parsed = SetPrimarySchema.safeParse(input);
  if (!parsed.success) return { success: false, error: "Invalid ID" };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Unauthorized" };

  // Unset all primary
  await supabase
    .from("user_bikes")
    .update({ is_primary: false })
    .eq("user_id", user.id);

  // Set new primary
  const { error } = await supabase
    .from("user_bikes")
    .update({ is_primary: true })
    .eq("id", parsed.data.userBikeId)
    .eq("user_id", user.id);

  if (error)
    return { success: false, error: "Αποτυχία ορισμού κύριας μηχανής" };

  revalidatePath("/garage");
  return { success: true };
}
