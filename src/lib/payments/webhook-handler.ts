/**
 * Payment webhook handler — the single source of truth for payment outcome.
 * Given a verified, provider-agnostic `PaymentEvent`, it creates the real
 * order from the Checkout-session snapshot when (and only when) payment is
 * confirmed. The browser redirect never marks an order paid. See ADR 0015.
 *
 * The route shell verifies the signature and injects the admin client; this
 * function is pure-ish (only DB I/O) so it is unit-testable with a stub.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Json } from "@/types/database";
import type { PaymentEvent, CheckoutLineSnapshot } from "./types";

type Admin = SupabaseClient<Database>;

export interface PaymentWebhookResult {
  ok: boolean;
  orderId?: string;
  orderNumber?: string;
  alreadyProcessed?: boolean;
  ignored?: boolean;
  error?: string;
}

export async function handlePaymentEvent(
  event: PaymentEvent,
  admin: Admin,
): Promise<PaymentWebhookResult> {
  if (event.type === "ignored") {
    return { ok: true, ignored: true };
  }

  // Locate our Checkout session. The provider echoes our id back as
  // client_reference_id; fall back to the provider session id.
  const lookupColumn = event.checkoutSessionId ? "id" : "provider_session_id";
  const lookupValue = event.checkoutSessionId ?? event.providerSessionId;

  const { data: session, error: sessionErr } = await admin
    .from("checkout_sessions")
    .select(
      "id, status, order_id, subtotal, shipping_cost, total, line_items, contact, provider_session_id",
    )
    .eq(lookupColumn, lookupValue)
    .single();

  if (sessionErr || !session) {
    // Unknown session: signal a non-durable failure so the provider retries.
    return { ok: false, error: "Checkout session not found." };
  }

  // Expiry: keep the session as a seed for abandoned-checkout email; never
  // create an order. Full marking lives in F-1.3 (#142).
  if (event.type === "expired") {
    return { ok: true };
  }

  // event.type === "completed"
  // Idempotency guard: a re-delivered completed event must not create a
  // second order. Hardened further in F-1.2 (#141).
  if (session.status === "completed" || session.order_id) {
    return { ok: true, alreadyProcessed: true };
  }

  const lines = (session.line_items as unknown as CheckoutLineSnapshot[]) ?? [];
  const orderNumber = `MM-${Date.now().toString(36).toUpperCase()}`;
  const address = session.contact as Json;

  const { data: order, error: orderErr } = await admin
    .from("orders")
    .insert({
      order_number: orderNumber,
      billing_address: address,
      shipping_address: address,
      subtotal: session.subtotal,
      shipping_cost: session.shipping_cost,
      total: session.total,
      discount: 0,
      payment_status: "paid",
      user_id: null,
    })
    .select("id, order_number")
    .single();

  if (orderErr || !order) {
    return { ok: false, error: "Failed to create order from session." };
  }

  const rows = lines.map((l) => ({
    order_id: order.id,
    product_id: l.productId,
    quantity: l.quantity,
    unit_price: l.unitPrice,
    total: l.lineTotal,
  }));

  const { error: itemsErr } = await admin.from("order_items").insert(rows);
  if (itemsErr) {
    return { ok: false, error: "Failed to create order items." };
  }

  const { error: updateErr } = await admin
    .from("checkout_sessions")
    .update({
      status: "completed",
      order_id: order.id,
      provider_session_id: event.providerSessionId,
      updated_at: new Date().toISOString(),
    })
    .eq("id", session.id);

  if (updateErr) {
    return { ok: false, error: "Failed to finalize checkout session." };
  }

  return { ok: true, orderId: order.id, orderNumber: order.order_number };
}
