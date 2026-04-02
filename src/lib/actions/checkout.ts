"use server";

import { z } from "zod/v4";
import { createClient } from "@/lib/supabase/server";
import { getCartId, clearCartId } from "@/lib/cart/cookie";
import { getCart } from "@/lib/queries/cart";
import {
  calculateSubtotal,
  calculateShipping,
  calculateTotal,
  generateOrderNumber,
  type ShippingMethodKey,
} from "@/lib/cart/utils";

type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string };

const PlaceOrderSchema = z.object({
  email: z.email(),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  phone: z.string().min(7),
  address: z.string().min(3),
  city: z.string().min(2),
  postalCode: z.string().min(4),
  country: z.string().default("GR"),
  shippingMethod: z.enum([
    "acs_standard",
    "acs_express",
    "store_pickup",
    "elta",
  ]),
});

export async function placeOrder(
  input: z.infer<typeof PlaceOrderSchema>,
): Promise<ActionResult<{ orderId: string; orderNumber: string }>> {
  const parsed = PlaceOrderSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Σφάλμα επικύρωσης",
    };
  }

  const cartId = await getCartId();
  if (!cartId) {
    return { success: false, error: "Δεν βρέθηκε καλάθι" };
  }

  const cart = await getCart(cartId);
  if (!cart || cart.items.length === 0) {
    return { success: false, error: "Το καλάθι είναι άδειο" };
  }

  const {
    firstName,
    lastName,
    phone,
    address,
    city,
    postalCode,
    country,
    shippingMethod,
  } = parsed.data;

  const subtotal = calculateSubtotal(cart.items);
  const shipping = calculateShipping(
    subtotal,
    shippingMethod as ShippingMethodKey,
  );
  const total = calculateTotal(subtotal, shipping);
  const orderNumber = generateOrderNumber();

  const shippingAddress = {
    name: `${firstName} ${lastName}`,
    phone,
    line1: address,
    city,
    postal_code: postalCode,
    country,
  };

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        user_id: user?.id ?? null,
        order_number: orderNumber,
        status: "pending",
        subtotal,
        shipping_cost: shipping,
        discount: 0,
        total,
        shipping_address: shippingAddress,
        billing_address: shippingAddress,
      })
      .select("id")
      .single();

    if (orderError || !order) {
      return {
        success: false,
        error: "Αποτυχία δημιουργίας παραγγελίας",
      };
    }

    const orderItems = cart.items.map((item) => ({
      order_id: order.id,
      product_id: item.product_id,
      quantity: item.quantity,
      unit_price: item.unit_price,
      total: item.unit_price * item.quantity,
    }));

    const { error: itemsError } = await supabase
      .from("order_items")
      .insert(orderItems);

    if (itemsError) {
      return {
        success: false,
        error: "Αποτυχία καταχώρησης προϊόντων παραγγελίας",
      };
    }

    // Clear cart
    await supabase.from("cart_items").delete().eq("cart_id", cartId);
    await supabase.from("carts").delete().eq("id", cartId);
    await clearCartId();

    return { success: true, data: { orderId: order.id, orderNumber } };
  } catch {
    return {
      success: false,
      error: "Κάτι πήγε στραβά. Δοκιμάστε ξανά.",
    };
  }
}
