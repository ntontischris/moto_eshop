import { createClient } from "@/lib/supabase/server";

export interface Bike {
  id: string;
  make: string;
  model: string;
  year: number;
  category: string | null;
}

export interface UserBike {
  id: string;
  is_primary: boolean;
  bike: Bike;
}

export async function getBikeMakes(): Promise<string[]> {
  const supabase = await createClient();
  const { data } = await supabase.from("bikes").select("make").order("make");

  return [...new Set((data ?? []).map((r) => r.make))];
}

export async function getBikeModels(make: string): Promise<string[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("bikes")
    .select("model")
    .eq("make", make)
    .order("model");

  return [...new Set((data ?? []).map((r) => r.model))];
}

export async function getBikeYears(
  make: string,
  model: string,
): Promise<number[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("bikes")
    .select("year")
    .eq("make", make)
    .eq("model", model)
    .order("year", { ascending: false });

  return (data ?? []).map((r) => r.year);
}

export async function getBikeId(
  make: string,
  model: string,
  year: number,
): Promise<string | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("bikes")
    .select("id")
    .eq("make", make)
    .eq("model", model)
    .eq("year", year)
    .maybeSingle();

  return data?.id ?? null;
}

export async function getUserBikes(userId: string): Promise<UserBike[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("user_bikes")
    .select("id, is_primary, bike:bikes(id, make, model, year, category)")
    .eq("user_id", userId)
    .order("is_primary", { ascending: false });

  return (data ?? []) as unknown as UserBike[];
}
