"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod/v4";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCartId, setCartId } from "@/lib/cart/cookie";
import { getCart, getCartByUserId, type CartItem } from "@/lib/queries/cart";
import { buildSizeVariants } from "@/app/[locale]/(store)/_lib/size-availability";
import type { CartLine } from "@/app/[locale]/(store)/_lib/cart-line";

type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string };

type AdminClient = ReturnType<typeof createAdminClient>;

// Cart-table reads/writes go through the service-role client. A guest cart is
// identified by an httpOnly `cart_id` cookie, which Postgres RLS cannot see, so
// ownership can't be expressed as an RLS policy — it is enforced in code here
// (the cookie/user resolves the caller's own cart, and every by-id mutation is
// guarded against it). This is the documented exception to the no-admin rule.

/** The signed-in user id, or null for a guest. Reads the auth cookie. */
async function currentUserId(): Promise<string | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user?.id ?? null;
}

/**
 * Resolve the caller's active cart: the account cart when logged in, otherwise
 * the cookie cart. With `create: false` returns null when none exists yet (used
 * by read + ownership paths); with `create: true` creates one (used by add).
 */
async function resolveCartId(
  admin: AdminClient,
  create: boolean,
): Promise<string | null> {
  const userId = await currentUserId();

  if (userId) {
    const { data: existing } = await admin
      .from("carts")
      .select("id")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (existing) {
      await setCartId(existing.id);
      return existing.id;
    }
    if (!create) return null;
    const { data: created } = await admin
      .from("carts")
      .insert({ user_id: userId })
      .select("id")
      .single();
    if (!created) return null;
    await setCartId(created.id);
    return created.id;
  }

  const cookieId = await getCartId();
  if (cookieId) {
    const { data: existing } = await admin
      .from("carts")
      .select("id")
      .eq("id", cookieId)
      .maybeSingle();
    if (existing) return cookieId;
  }
  if (!create) return null;
  const { data: created } = await admin
    .from("carts")
    .insert({ session_id: crypto.randomUUID() })
    .select("id")
    .single();
  if (!created) return null;
  await setCartId(created.id);
  return created.id;
}

/** True only if `cartItemId` belongs to the caller's own current cart (anti-IDOR). */
async function ownsCartItem(
  admin: AdminClient,
  cartItemId: string,
): Promise<{ cartId: string } | null> {
  const cartId = await resolveCartId(admin, false);
  if (!cartId) return null;
  const { data } = await admin
    .from("cart_items")
    .select("cart_id")
    .eq("id", cartItemId)
    .maybeSingle();
  return data && data.cart_id === cartId ? { cartId } : null;
}

/**
 * Server-authoritative per-size stock check (ADR 0001). A stale page must not
 * oversell an out-of-stock [Size code]; fails closed on a read error or unknown
 * size.
 */
async function sizeInStock(
  admin: AdminClient,
  productId: string,
  size: string,
): Promise<boolean> {
  const { data, error } = await admin
    .from("v_product_available_stock")
    .select("size, available")
    .eq("product_id", productId)
    .eq("size", size);
  if (error || !data) return false;
  const variant = buildSizeVariants(data).find((v) => v.code === size);
  return variant != null && variant.state !== "out";
}

function cartItemToLine(item: CartItem): CartLine {
  return {
    id: item.id,
    productId: item.product_id,
    slug: item.product_slug,
    name: item.product_name,
    brand: item.product_brand,
    categorySlug: item.category_slug,
    price: item.unit_price,
    size: item.size,
    image: item.product_image_url,
    qty: item.quantity,
  };
}

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

const ChangeItemSizeSchema = z.object({
  cartItemId: z.string().uuid(),
  size: z.string().min(1),
});

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
    const admin = createAdminClient();

    // A sized add is validated against live per-size stock before it touches the
    // cart, so a stale page can't oversell (ADR 0001).
    if (size && !(await sizeInStock(admin, productId, size))) {
      return { success: false, error: "Το μέγεθος εξαντλήθηκε" };
    }

    const cartId = await resolveCartId(admin, true);
    if (!cartId) return { success: false, error: "Αποτυχία καλαθιού" };

    // Dedup on (cart, product, size, color).
    let query = admin
      .from("cart_items")
      .select("id, quantity")
      .eq("cart_id", cartId)
      .eq("product_id", productId);
    query = size ? query.eq("size", size) : query.is("size", null);
    query = color ? query.eq("color", color) : query.is("color", null);
    const { data: existingItem } = await query.maybeSingle();

    if (existingItem) {
      const { error } = await admin
        .from("cart_items")
        .update({ quantity: existingItem.quantity + quantity })
        .eq("id", existingItem.id);
      if (error)
        return { success: false, error: "Αποτυχία ενημέρωσης καλαθιού" };
    } else {
      const { error } = await admin.from("cart_items").insert({
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

    const { data: items } = await admin
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
    const admin = createAdminClient();
    if (!(await ownsCartItem(admin, cartItemId))) {
      return { success: false, error: "Δεν βρέθηκε το προϊόν" };
    }

    if (quantity === 0) {
      const { error } = await admin
        .from("cart_items")
        .delete()
        .eq("id", cartItemId);
      if (error)
        return { success: false, error: "Αποτυχία αφαίρεσης προϊόντος" };
    } else {
      const { error } = await admin
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
    const admin = createAdminClient();
    if (!(await ownsCartItem(admin, parsed.data.cartItemId))) {
      return { success: false, error: "Δεν βρέθηκε το προϊόν" };
    }
    const { error } = await admin
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

/**
 * Change a cart line's [Size code] (B1). Re-validates the new size against live
 * stock, then either updates the line in place or — if the target (cart,
 * product, size, color) already exists — merges the quantities into that line
 * and drops this one (consistent with add-to-cart dedup).
 */
export async function changeItemSize(
  input: z.infer<typeof ChangeItemSizeSchema>,
): Promise<ActionResult> {
  const parsed = ChangeItemSizeSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Invalid input",
    };
  }
  const { cartItemId, size } = parsed.data;

  try {
    const admin = createAdminClient();
    if (!(await ownsCartItem(admin, cartItemId))) {
      return { success: false, error: "Δεν βρέθηκε το προϊόν" };
    }

    const { data: line } = await admin
      .from("cart_items")
      .select("id, cart_id, product_id, quantity, color, size")
      .eq("id", cartItemId)
      .maybeSingle();
    if (!line) return { success: false, error: "Δεν βρέθηκε το προϊόν" };
    if (line.size === size) return { success: true, data: undefined };

    if (!(await sizeInStock(admin, line.product_id, size))) {
      return { success: false, error: "Το μέγεθος εξαντλήθηκε" };
    }

    let targetQuery = admin
      .from("cart_items")
      .select("id, quantity")
      .eq("cart_id", line.cart_id)
      .eq("product_id", line.product_id)
      .eq("size", size)
      .neq("id", line.id);
    targetQuery = line.color
      ? targetQuery.eq("color", line.color)
      : targetQuery.is("color", null);
    const { data: target } = await targetQuery.maybeSingle();

    if (target) {
      await admin
        .from("cart_items")
        .update({ quantity: target.quantity + line.quantity })
        .eq("id", target.id);
      await admin.from("cart_items").delete().eq("id", line.id);
    } else {
      await admin.from("cart_items").update({ size }).eq("id", line.id);
    }

    revalidatePath("/cart");
    return { success: true, data: undefined };
  } catch {
    return { success: false, error: "Κάτι πήγε στραβά. Δοκίμασε ξανά." };
  }
}

/**
 * The current cart's lines (cookie cart for guests, account cart when logged in)
 * mapped to the storefront `CartLine` shape. Read-only — never creates a cart.
 */
export async function getCartLines(): Promise<CartLine[]> {
  const admin = createAdminClient();
  const cartId = await resolveCartId(admin, false);
  if (!cartId) return [];
  const cart = await getCart(cartId);
  return cart ? cart.items.map(cartItemToLine) : [];
}

/** Empty the caller's current cart (e.g. after a successful order). */
export async function clearCart(): Promise<ActionResult> {
  try {
    const admin = createAdminClient();
    const cartId = await resolveCartId(admin, false);
    if (cartId) {
      await admin.from("cart_items").delete().eq("cart_id", cartId);
    }
    revalidatePath("/cart");
    return { success: true, data: undefined };
  } catch {
    return { success: false, error: "Κάτι πήγε στραβά. Δοκίμασε ξανά." };
  }
}

/**
 * Fold the guest cookie cart into the user's account cart on login (union by
 * product+size+color, summing quantities), then delete the guest cart and point
 * the cookie at the account cart. `userId` is the just-authenticated user.
 */
export async function mergeGuestCartOnLogin(userId: string): Promise<void> {
  const guestCartId = await getCartId();
  if (!guestCartId) return;

  const admin = createAdminClient();
  const guestCart = await getCart(guestCartId);
  if (!guestCart || guestCart.items.length === 0) return;
  // Already the account cart (nothing to merge into itself).
  if (guestCart.user_id === userId) return;

  const userCart = await getCartByUserId(userId);
  let userCartId: string;
  if (userCart) {
    userCartId = userCart.id;
  } else {
    const { data: newCart, error } = await admin
      .from("carts")
      .insert({ user_id: userId })
      .select("id")
      .single();
    if (error || !newCart) return;
    userCartId = newCart.id;
  }

  for (const guestItem of guestCart.items) {
    let query = admin
      .from("cart_items")
      .select("id, quantity")
      .eq("cart_id", userCartId)
      .eq("product_id", guestItem.product_id);
    query = guestItem.size
      ? query.eq("size", guestItem.size)
      : query.is("size", null);
    query = guestItem.color
      ? query.eq("color", guestItem.color)
      : query.is("color", null);
    const { data: existingItem } = await query.maybeSingle();

    if (existingItem) {
      await admin
        .from("cart_items")
        .update({ quantity: existingItem.quantity + guestItem.quantity })
        .eq("id", existingItem.id);
    } else {
      await admin.from("cart_items").insert({
        cart_id: userCartId,
        product_id: guestItem.product_id,
        quantity: guestItem.quantity,
        unit_price: guestItem.unit_price,
        size: guestItem.size,
        color: guestItem.color,
      });
    }
  }

  await admin.from("carts").delete().eq("id", guestCartId);
  await setCartId(userCartId);
  revalidatePath("/cart");
}
