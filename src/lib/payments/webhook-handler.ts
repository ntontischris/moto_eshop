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
import type { PaymentEvent } from "./types";

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
  // Cheap fast-path: a re-delivered completed event for an already-finalized
  // session does no work. The race-safe guarantee lives in the RPC below.
  if (session.status === "completed" || session.order_id) {
    return { ok: true, alreadyProcessed: true };
  }

  // Atomic create (ADR 0015): order + order_items + session-finalize +
  // mark-event-processed run in a single Postgres transaction. The function
  // dedups on the provider event id and enforces one order per Checkout
  // session at the DB level, so a duplicate or racing webhook physically
  // cannot create a second order. supabase-js can't run a multi-statement
  // transaction from the client, hence the RPC.
  const { data, error } = await admin.rpc("create_order_from_payment", {
    p_event_id: event.eventId,
    p_session_id: session.id,
    p_address: session.contact as Json,
    p_subtotal: session.subtotal,
    p_shipping: session.shipping_cost,
    p_total: session.total,
    p_line_items: session.line_items as Json,
  });

  // Non-2xx on failure → the route returns 5xx → the provider retries. The
  // event is only marked processed inside a committed transaction, so a
  // transient failure here is retried, never a lost payment.
  if (error || !data) {
    return { ok: false, error: "Failed to create order from session." };
  }

  const result = data as {
    already_processed?: boolean;
    order_id?: string;
    order_number?: string;
  };

  if (result.already_processed) {
    return { ok: true, alreadyProcessed: true };
  }

  return {
    ok: true,
    orderId: result.order_id,
    orderNumber: result.order_number,
  };
}
