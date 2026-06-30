import { describe, it, expect } from "vitest";
import { handlePaymentEvent } from "./webhook-handler";
import type { PaymentEvent } from "./types";

interface RpcCall {
  fn: string;
  args: Record<string, unknown>;
}

const sessionRow = {
  id: "our-session-1",
  provider: "stripe",
  provider_session_id: "cs_test_123",
  status: "pending",
  order_id: null,
  subtotal: 200,
  shipping_cost: 5,
  total: 205,
  amount_total: 20500,
  currency: "eur",
  line_items: [
    {
      productId: "p-1",
      slug: "helmet",
      name: "Helmet",
      quantity: 1,
      unitPrice: 200,
      lineTotal: 200,
    },
  ],
  contact: { email: "a@b.gr", fullName: "Test User", payment: "card" },
};

/**
 * Stub admin client. The session snapshot is still read via `from(...).select`,
 * but the order/items/finalize/mark-processed writes now go through a single
 * atomic `rpc("create_order_from_payment", ...)` call (F-1.2 / ADR 0015).
 */
function stubAdmin(opts: {
  session: Record<string, unknown> | null;
  rpcResult?: { data: unknown; error: unknown };
  rpcCalls: RpcCall[];
}) {
  return {
    from(table: string) {
      if (table === "checkout_sessions") {
        return {
          select: () => ({
            eq: () => ({
              single: async () => ({ data: opts.session, error: null }),
            }),
          }),
        };
      }
      throw new Error(`unexpected table ${table}`);
    },
    rpc(fn: string, args: Record<string, unknown>) {
      opts.rpcCalls.push({ fn, args });
      return Promise.resolve(opts.rpcResult ?? { data: null, error: null });
    },
  };
}

const completedEvent: PaymentEvent = {
  type: "completed",
  eventId: "evt_1",
  providerSessionId: "cs_test_123",
  checkoutSessionId: "our-session-1",
};

describe("handlePaymentEvent", () => {
  it("creates exactly one order via one atomic RPC on completed", async () => {
    const rpcCalls: RpcCall[] = [];
    const res = await handlePaymentEvent(
      completedEvent,
      stubAdmin({
        session: { ...sessionRow },
        rpcResult: {
          data: { order_id: "order-1", order_number: "MM-000001" },
          error: null,
        },
        rpcCalls,
      }) as never,
    );

    expect(res.ok).toBe(true);
    expect(res.orderId).toBe("order-1");
    expect(res.orderNumber).toBe("MM-000001");

    // Exactly one atomic write, carrying the event id (for dedup) + snapshot.
    expect(rpcCalls).toHaveLength(1);
    expect(rpcCalls[0].fn).toBe("create_order_from_payment");
    expect(rpcCalls[0].args.p_event_id).toBe("evt_1");
    expect(rpcCalls[0].args.p_session_id).toBe("our-session-1");
    expect(rpcCalls[0].args.p_subtotal).toBe(200);
    expect(rpcCalls[0].args.p_total).toBe(205);
    expect(rpcCalls[0].args.p_line_items).toEqual(sessionRow.line_items);
  });

  it("treats a duplicate event (RPC reports already_processed) as a no-op success", async () => {
    const rpcCalls: RpcCall[] = [];
    const res = await handlePaymentEvent(
      completedEvent,
      stubAdmin({
        session: { ...sessionRow },
        rpcResult: { data: { already_processed: true }, error: null },
        rpcCalls,
      }) as never,
    );

    expect(res.ok).toBe(true);
    expect(res.alreadyProcessed).toBe(true);
    expect(res.orderId).toBeUndefined();
    // The RPC is the atomic dedup point — it is still consulted.
    expect(rpcCalls).toHaveLength(1);
  });

  it("does not call the RPC when the session is already completed (fast path)", async () => {
    const rpcCalls: RpcCall[] = [];
    const res = await handlePaymentEvent(
      completedEvent,
      stubAdmin({
        session: { ...sessionRow, status: "completed", order_id: "order-1" },
        rpcCalls,
      }) as never,
    );

    expect(res.ok).toBe(true);
    expect(res.alreadyProcessed).toBe(true);
    expect(rpcCalls).toHaveLength(0);
  });

  it("returns a non-durable failure when the RPC errors, so the provider retries", async () => {
    const rpcCalls: RpcCall[] = [];
    const res = await handlePaymentEvent(
      completedEvent,
      stubAdmin({
        session: { ...sessionRow },
        rpcResult: { data: null, error: { message: "deadlock detected" } },
        rpcCalls,
      }) as never,
    );

    expect(res.ok).toBe(false);
    expect(rpcCalls).toHaveLength(1);
  });

  it("returns a non-durable failure when the session is not found", async () => {
    const rpcCalls: RpcCall[] = [];
    const res = await handlePaymentEvent(
      completedEvent,
      stubAdmin({ session: null, rpcCalls }) as never,
    );

    expect(res.ok).toBe(false);
    expect(rpcCalls).toHaveLength(0);
  });

  it("creates no order and calls no RPC for an expired event", async () => {
    const rpcCalls: RpcCall[] = [];
    const expired: PaymentEvent = {
      type: "expired",
      eventId: "evt_2",
      providerSessionId: "cs_test_123",
      checkoutSessionId: "our-session-1",
    };
    const res = await handlePaymentEvent(
      expired,
      stubAdmin({ session: { ...sessionRow }, rpcCalls }) as never,
    );

    expect(res.ok).toBe(true);
    expect(rpcCalls).toHaveLength(0);
  });

  it("ignores an unrelated event without creating an order", async () => {
    const rpcCalls: RpcCall[] = [];
    const res = await handlePaymentEvent(
      { type: "ignored", eventId: "evt_3" },
      stubAdmin({ session: null, rpcCalls }) as never,
    );

    expect(res.ok).toBe(true);
    expect(res.ignored).toBe(true);
    expect(rpcCalls).toHaveLength(0);
  });
});
