"use server";

import { createAdminClient } from "@/lib/supabase/admin";

export type ResolveResult =
  | { status: "completed"; orderNumber: string; total: number }
  | { status: "pending" }
  | { status: "expired" }
  | { status: "not_found" };

/**
 * Resolves a card Checkout session to its real order. The success page polls
 * this after the provider redirect: the order exists only once the webhook has
 * confirmed payment, so a returning customer briefly sees "pending" and never
 * a fake thank-you for an order that does not exist (ADR 0015).
 *
 * Reads via the admin client (checkout_sessions is service-role only) — safe:
 * the session id is an unguessable UUID and only the order number/total leak.
 */
export async function resolveCheckoutSession(
  sessionId: string,
): Promise<ResolveResult> {
  const supabase = createAdminClient();

  const { data: session } = await supabase
    .from("checkout_sessions")
    .select("status, order_id")
    .eq("id", sessionId)
    .maybeSingle();

  if (!session) {
    return { status: "not_found" };
  }

  if (session.status === "completed" && session.order_id) {
    const { data: order } = await supabase
      .from("orders")
      .select("order_number, total")
      .eq("id", session.order_id)
      .maybeSingle();
    if (order) {
      return {
        status: "completed",
        orderNumber: order.order_number,
        total: order.total,
      };
    }
  }

  if (session.status === "expired") {
    return { status: "expired" };
  }

  return { status: "pending" };
}
