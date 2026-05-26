import { NextResponse } from "next/server";
import { getCartId } from "@/lib/cart/cookie";
import { getCart } from "@/lib/queries/cart";
import { calculateSubtotal } from "@/lib/cart/utils";

export interface CartSummary {
  itemCount: number;
  totalCents: number;
  currency: string;
}

export async function GET(): Promise<NextResponse<CartSummary>> {
  const cartId = await getCartId();

  if (!cartId) {
    return NextResponse.json({ itemCount: 0, totalCents: 0, currency: "EUR" });
  }

  const cart = await getCart(cartId);

  if (!cart) {
    return NextResponse.json({ itemCount: 0, totalCents: 0, currency: "EUR" });
  }

  const itemCount = cart.items.reduce((sum, item) => sum + item.quantity, 0);
  const subtotalEuros = calculateSubtotal(cart.items);
  const totalCents = Math.round(subtotalEuros * 100);

  return NextResponse.json({ itemCount, totalCents, currency: "EUR" });
}
