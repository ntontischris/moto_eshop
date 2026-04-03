"use server";

import { z } from "zod/v4";
import { revalidatePath, revalidateTag } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { Json } from "@/types/database";

type ActionResult = { success: true } | { success: false; error: string };

async function assertAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  const role = (profile?.role as string) ?? "user";
  if (role !== "admin" && role !== "super_admin") {
    throw new Error("Forbidden");
  }
  return user;
}

// ─── Products ─────────────────────────────────────────────────────

const ProductSchema = z.object({
  name: z.string().min(1, "Το όνομα είναι υποχρεωτικό"),
  slug: z.string().min(1, "Το slug είναι υποχρεωτικό"),
  description: z.string().optional(),
  price: z.coerce.number().min(0),
  compare_at_price: z.coerce.number().min(0).optional(),
  cost_price: z.coerce.number().min(0).optional(),
  stock: z.coerce.number().int().min(0),
  sku: z.string().optional(),
  brand_id: z.string().uuid().optional(),
  category_id: z.string().uuid().optional(),
  status: z.enum(["draft", "active", "archived"]),
  certification: z.string().optional(),
  rider_type: z
    .enum(["beginner", "intermediate", "advanced", "professional"])
    .optional(),
  images: z
    .array(z.object({ url: z.string(), alt: z.string(), position: z.number() }))
    .optional(),
  specs: z.record(z.string(), z.string()).optional(),
});

export async function createProduct(
  input: z.infer<typeof ProductSchema>,
): Promise<ActionResult> {
  await assertAdmin();
  const parsed = ProductSchema.safeParse(input);
  if (!parsed.success)
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Μη έγκυρα δεδομένα",
    };

  const supabase = createAdminClient();
  const { images: _imgs, specs: _specs, ...rest } = parsed.data;
  const { error } = await supabase.from("products").insert({
    ...rest,
    compare_at_price: rest.compare_at_price ?? null,
    cost_price: rest.cost_price ?? null,
    brand_id: rest.brand_id ?? null,
    category_id: rest.category_id ?? null,
    images: (parsed.data.images ?? []) as unknown as Json[],
    specs: (parsed.data.specs ?? {}) as unknown as Json,
  });

  if (error) return { success: false, error: error.message };
  revalidatePath("/admin/products");
  revalidateTag("products", "seconds");
  return { success: true };
}

export async function updateProduct(
  id: string,
  input: z.infer<typeof ProductSchema>,
): Promise<ActionResult> {
  await assertAdmin();
  const parsed = ProductSchema.safeParse(input);
  if (!parsed.success)
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Μη έγκυρα δεδομένα",
    };

  const supabase = createAdminClient();
  const { images: _imgs, specs: _specs, ...rest } = parsed.data;
  const { error } = await supabase
    .from("products")
    .update({
      ...rest,
      compare_at_price: rest.compare_at_price ?? null,
      cost_price: rest.cost_price ?? null,
      brand_id: rest.brand_id ?? null,
      category_id: rest.category_id ?? null,
      images: (parsed.data.images ?? []) as unknown as Json[],
      specs: (parsed.data.specs ?? {}) as unknown as Json,
    })
    .eq("id", id);

  if (error) return { success: false, error: error.message };
  revalidatePath("/admin/products");
  revalidateTag("products", "seconds");
  return { success: true };
}

export async function deleteProduct(id: string): Promise<ActionResult> {
  await assertAdmin();
  const supabase = createAdminClient();
  const { error } = await supabase.from("products").delete().eq("id", id);
  if (error) return { success: false, error: error.message };
  revalidatePath("/admin/products");
  revalidateTag("products", "seconds");
  return { success: true };
}

// ─── Orders ───────────────────────────────────────────────────────

const OrderStatusSchema = z.object({
  status: z.enum([
    "pending",
    "confirmed",
    "processing",
    "shipped",
    "delivered",
    "cancelled",
    "refunded",
  ]),
  note: z.string().optional(),
});

export async function updateOrderStatus(
  orderId: string,
  input: z.infer<typeof OrderStatusSchema>,
): Promise<ActionResult> {
  await assertAdmin();
  const parsed = OrderStatusSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: "Μη έγκυρη κατάσταση" };

  const supabase = createAdminClient();

  const { error: orderError } = await supabase
    .from("orders")
    .update({ status: parsed.data.status })
    .eq("id", orderId);

  if (orderError) return { success: false, error: orderError.message };

  await supabase.from("order_events").insert({
    order_id: orderId,
    status: parsed.data.status,
    note: parsed.data.note ?? null,
  });

  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${orderId}`);
  return { success: true };
}

// ─── Categories ───────────────────────────────────────────────────

const CategorySchema = z.object({
  name: z.string().min(1, "Το όνομα είναι υποχρεωτικό"),
  slug: z.string().min(1, "Το slug είναι υποχρεωτικό"),
  description: z.string().optional(),
  parent_id: z.string().uuid().nullable().optional(),
  position: z.coerce.number().int().min(0).optional(),
  image_url: z.string().optional(),
});

export async function createCategory(
  input: z.infer<typeof CategorySchema>,
): Promise<ActionResult> {
  await assertAdmin();
  const parsed = CategorySchema.safeParse(input);
  if (!parsed.success)
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Μη έγκυρα δεδομένα",
    };

  const supabase = createAdminClient();
  const { error } = await supabase.from("categories").insert({
    ...parsed.data,
    parent_id: parsed.data.parent_id ?? null,
    position: parsed.data.position ?? 0,
  });

  if (error) return { success: false, error: error.message };
  revalidatePath("/admin/categories");
  revalidateTag("categories", "seconds");
  return { success: true };
}

export async function updateCategory(
  id: string,
  input: z.infer<typeof CategorySchema>,
): Promise<ActionResult> {
  await assertAdmin();
  const parsed = CategorySchema.safeParse(input);
  if (!parsed.success)
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Μη έγκυρα δεδομένα",
    };

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("categories")
    .update({
      ...parsed.data,
      parent_id: parsed.data.parent_id ?? null,
      position: parsed.data.position ?? 0,
    })
    .eq("id", id);

  if (error) return { success: false, error: error.message };
  revalidatePath("/admin/categories");
  revalidateTag("categories", "seconds");
  return { success: true };
}

export async function deleteCategory(id: string): Promise<ActionResult> {
  await assertAdmin();
  const supabase = createAdminClient();
  const { error } = await supabase.from("categories").delete().eq("id", id);
  if (error) return { success: false, error: error.message };
  revalidatePath("/admin/categories");
  revalidateTag("categories", "seconds");
  return { success: true };
}

// ─── Brands ───────────────────────────────────────────────────────

const BrandSchema = z.object({
  name: z.string().min(1, "Το όνομα είναι υποχρεωτικό"),
  slug: z.string().min(1, "Το slug είναι υποχρεωτικό"),
  description: z.string().optional(),
  logo_url: z.string().optional(),
});

export async function createBrand(
  input: z.infer<typeof BrandSchema>,
): Promise<ActionResult> {
  await assertAdmin();
  const parsed = BrandSchema.safeParse(input);
  if (!parsed.success)
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Μη έγκυρα δεδομένα",
    };

  const supabase = createAdminClient();
  const { error } = await supabase.from("brands").insert(parsed.data);
  if (error) return { success: false, error: error.message };
  revalidatePath("/admin/categories");
  revalidateTag("brands", "seconds");
  return { success: true };
}

export async function updateBrand(
  id: string,
  input: z.infer<typeof BrandSchema>,
): Promise<ActionResult> {
  await assertAdmin();
  const parsed = BrandSchema.safeParse(input);
  if (!parsed.success)
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Μη έγκυρα δεδομένα",
    };

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("brands")
    .update(parsed.data)
    .eq("id", id);
  if (error) return { success: false, error: error.message };
  revalidatePath("/admin/categories");
  revalidateTag("brands", "seconds");
  return { success: true };
}

export async function deleteBrand(id: string): Promise<ActionResult> {
  await assertAdmin();
  const supabase = createAdminClient();
  const { error } = await supabase.from("brands").delete().eq("id", id);
  if (error) return { success: false, error: error.message };
  revalidatePath("/admin/categories");
  revalidateTag("brands", "seconds");
  return { success: true };
}

// ─── Reviews ──────────────────────────────────────────────────────

export async function approveReview(id: string): Promise<ActionResult> {
  await assertAdmin();
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("reviews")
    .update({ status: "approved" })
    .eq("id", id);
  if (error) return { success: false, error: error.message };
  revalidatePath("/admin/reviews");
  revalidateTag("reviews", "seconds");
  return { success: true };
}

export async function rejectReview(id: string): Promise<ActionResult> {
  await assertAdmin();
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("reviews")
    .update({ status: "rejected" })
    .eq("id", id);
  if (error) return { success: false, error: error.message };
  revalidatePath("/admin/reviews");
  revalidateTag("reviews", "seconds");
  return { success: true };
}

export async function deleteReview(id: string): Promise<ActionResult> {
  await assertAdmin();
  const supabase = createAdminClient();
  const { error } = await supabase.from("reviews").delete().eq("id", id);
  if (error) return { success: false, error: error.message };
  revalidatePath("/admin/reviews");
  revalidateTag("reviews", "seconds");
  return { success: true };
}

// ─── Users ────────────────────────────────────────────────────────

export async function updateUserRole(
  userId: string,
  role: "user" | "admin" | "super_admin",
): Promise<ActionResult> {
  await assertAdmin();
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("user_profiles")
    .update({ role })
    .eq("id", userId);
  if (error) return { success: false, error: error.message };
  revalidatePath("/admin/users");
  return { success: true };
}
