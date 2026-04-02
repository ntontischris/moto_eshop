"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod/v4";
import { createClient } from "@/lib/supabase/server";
import { getCartId, setCartId } from "@/lib/cart/cookie";
import { getCart, getCartByUserId } from "@/lib/queries/cart";

type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string };

const AddToCartSchema = z.object({
  productId: z.string().uuid(),
  quantity: z.number().int().min(1).max(99),
  unitPrice: z.number().positive(),
  size: z.string().nullable().optional(),
  color: z.string().nullable().optional(),
});

const UpdateQuantitySchema = z.object({
  cartItemId: z.string().uuid(),
  quantity: z.number().int().min(0).max(99),
});

const RemoveFromCartSchema = z.object({
  cartItemId: z.string().uuid(),
});

async function getOrCreateCartId(): Promise<string> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const { data: existingCart } = await supabase
      .from("carts")
      .select("id")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (existingCart) {
      await setCartId(existingCart.id);
      return existingCart.id;
    }

    const { data: newCart, error } = await supabase
      .from("carts")
      .insert({ user_id: user.id })
      .select("id")
      .single();

    if (error || !newCart) throw new Error("Failed to create cart");
    await setCartId(newCart.id);
    return newCart.id;
  }

  const existingCartId = await getCartId();
  if (existingCartId) {
    const { data: existingCart } = await supabase
      .from("carts")
      .select("id")
      .eq("id", existingCartId)
      .single();

    if (existingCart) return existingCartId;
  }

  const sessionId = crypto.randomUUID();
  const { data: newCart, error } = await supabase
    .from("carts")
    .insert({ session_id: sessionId })
    .select("id")
    .single();

  if (error || !newCart) throw new Error("Failed to create guest cart");
  await setCartId(newCart.id);
  return newCart.id;
}

export async function addToCart(
  input: z.infer<typeof AddToCartSchema>,
): Promise<ActionResult<{ cartId: string; itemCount: number }>> {
  const parsed = AddToCartSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Invalid input",
    };
  }

  const { productId, quantity, unitPrice, size, color } = parsed.data;

  try {
    const supabase = await createClient();
    const cartId = await getOrCreateCartId();

    // Check for existing item with same product + size + color
    let query = supabase
      .from("cart_items")
      .select("id, quantity")
      .eq("cart_id", cartId)
      .eq("product_id", productId);

    if (size) {
      query = query.eq("size", size);
    } else {
      query = query.is("size", null);
    }

    if (color) {
      query = query.eq("color", color);
    } else {
      query = query.is("color", null);
    }

    const { data: existingItem } = await query.maybeSingle();

    if (existingItem) {
      const { error } = await supabase
        .from("cart_items")
        .update({ quantity: existingItem.quantity + quantity })
        .eq("id", existingItem.id);

      if (error)
        return { success: false, error: "Αποτυχία ενημέρωσης καλαθιού" };
    } else {
      const { error } = await supabase.from("cart_items").insert({
        cart_id: cartId,
        product_id: productId,
        quantity,
        unit_price: unitPrice,
        size: size ?? null,
        color: color ?? null,
      });

      if (error)
        return { success: false, error: "Αποτυχία προσθήκης στο καλάθι" };
    }

    const { data: items } = await supabase
      .from("cart_items")
      .select("quantity")
      .eq("cart_id", cartId);

    const itemCount = (items ?? []).reduce((sum, i) => sum + i.quantity, 0);

    revalidatePath("/cart");
    return { success: true, data: { cartId, itemCount } };
  } catch {
    return { success: false, error: "Κάτι πήγε στραβά. Δοκίμασε ξανά." };
  }
}

export async function updateQuantity(
  input: z.infer<typeof UpdateQuantitySchema>,
): Promise<ActionResult> {
  const parsed = UpdateQuantitySchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Invalid input",
    };
  }

  const { cartItemId, quantity } = parsed.data;

  try {
    const supabase = await createClient();

    if (quantity === 0) {
      const { error } = await supabase
        .from("cart_items")
        .delete()
        .eq("id", cartItemId);
      if (error)
        return { success: false, error: "Αποτυχία αφαίρεσης προϊόντος" };
    } else {
      const { error } = await supabase
        .from("cart_items")
        .update({ quantity })
        .eq("id", cartItemId);
      if (error)
        return { success: false, error: "Αποτυχία ενημέρωσης ποσότητας" };
    }

    revalidatePath("/cart");
    return { success: true, data: undefined };
  } catch {
    return { success: false, error: "Κάτι πήγε στραβά. Δοκίμασε ξανά." };
  }
}

export async function removeFromCart(
  input: z.infer<typeof RemoveFromCartSchema>,
): Promise<ActionResult> {
  const parsed = RemoveFromCartSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Invalid input",
    };
  }

  try {
    const supabase = await createClient();
    const { error } = await supabase
      .from("cart_items")
      .delete()
      .eq("id", parsed.data.cartItemId);
    if (error) return { success: false, error: "Αποτυχία αφαίρεσης προϊόντος" };

    revalidatePath("/cart");
    return { success: true, data: undefined };
  } catch {
    return { success: false, error: "Κάτι πήγε στραβά. Δοκίμασε ξανά." };
  }
}

export async function mergeGuestCartOnLogin(userId: string): Promise<void> {
  const guestCartId = await getCartId();
  if (!guestCartId) return;

  const supabase = await createClient();
  const guestCart = await getCart(guestCartId);
  if (!guestCart || guestCart.items.length === 0) return;

  const userCart = await getCartByUserId(userId);
  let userCartId: string;

  if (userCart) {
    userCartId = userCart.id;
  } else {
    const { data: newCart, error } = await supabase
      .from("carts")
      .insert({ user_id: userId })
      .select("id")
      .single();

    if (error || !newCart) return;
    userCartId = newCart.id;
  }

  for (const guestItem of guestCart.items) {
    let query = supabase
      .from("cart_items")
      .select("id, quantity")
      .eq("cart_id", userCartId)
      .eq("product_id", guestItem.product_id);

    if (guestItem.size) {
      query = query.eq("size", guestItem.size);
    } else {
      query = query.is("size", null);
    }

    if (guestItem.color) {
      query = query.eq("color", guestItem.color);
    } else {
      query = query.is("color", null);
    }

    const { data: existingItem } = await query.maybeSingle();

    if (existingItem) {
      await supabase
        .from("cart_items")
        .update({ quantity: existingItem.quantity + guestItem.quantity })
        .eq("id", existingItem.id);
    } else {
      await supabase.from("cart_items").insert({
        cart_id: userCartId,
        product_id: guestItem.product_id,
        quantity: guestItem.quantity,
        unit_price: guestItem.unit_price,
        size: guestItem.size,
        color: guestItem.color,
      });
    }
  }

  await supabase.from("carts").delete().eq("id", guestCartId);
  await setCartId(userCartId);
  revalidatePath("/cart");
}
