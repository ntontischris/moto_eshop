import { describe, it, expect } from "vitest";
import { handlePaymentEvent } from "./webhook-handler";
import type { PaymentEvent } from "./types";

interface Capture {
  order?: Record<string, unknown>;
  orderItems?: Array<Record<string, unknown>>;
  sessionUpdate?: Record<string, unknown>;
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

function stubAdmin(opts: {
  session: Record<string, unknown> | null;
  capture: Capture;
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
          update: (row: Record<string, unknown>) => {
            opts.capture.sessionUpdate = row;
            return { eq: async () => ({ error: null }) };
          },
        };
      }
      if (table === "orders") {
        return {
          insert: (row: Record<string, unknown>) => {
            opts.capture.order = row;
            return {
              select: () => ({
                single: async () => ({
                  data: { id: "order-1", order_number: row.order_number },
                  error: null,
                }),
              }),
            };
          },
        };
      }
      if (table === "order_items") {
        return {
          insert: async (rows: Array<Record<string, unknown>>) => {
            opts.capture.orderItems = rows;
            return { error: null };
          },
        };
      }
      throw new Error(`unexpected table ${table}`);
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
  it("creates exactly one paid order from the session snapshot on completed", async () => {
    const capture: Capture = {};
    const res = await handlePaymentEvent(
      completedEvent,
      stubAdmin({ session: { ...sessionRow }, capture }) as never,
    );

    expect(res.ok).toBe(true);
    expect(res.orderNumber).toBeDefined();
    expect(capture.order?.payment_status).toBe("paid");
    expect(capture.order?.subtotal).toBe(200);
    expect(capture.order?.total).toBe(205);
    expect(capture.orderItems).toHaveLength(1);
    expect(capture.orderItems?.[0].product_id).toBe("p-1");
    expect(capture.orderItems?.[0].unit_price).toBe(200);
    // session marked completed and linked to the new order
    expect(capture.sessionUpdate?.status).toBe("completed");
    expect(capture.sessionUpdate?.order_id).toBe("order-1");
  });

  it("does not create a second order when the session is already completed", async () => {
    const capture: Capture = {};
    const res = await handlePaymentEvent(
      completedEvent,
      stubAdmin({
        session: { ...sessionRow, status: "completed", order_id: "order-1" },
        capture,
      }) as never,
    );

    expect(res.ok).toBe(true);
    expect(res.alreadyProcessed).toBe(true);
    expect(capture.order).toBeUndefined();
  });

  it("creates no order for an expired event", async () => {
    const capture: Capture = {};
    const expired: PaymentEvent = {
      type: "expired",
      eventId: "evt_2",
      providerSessionId: "cs_test_123",
      checkoutSessionId: "our-session-1",
    };
    const res = await handlePaymentEvent(
      expired,
      stubAdmin({ session: { ...sessionRow }, capture }) as never,
    );

    expect(res.ok).toBe(true);
    expect(capture.order).toBeUndefined();
  });

  it("ignores an unrelated event without creating an order", async () => {
    const capture: Capture = {};
    const res = await handlePaymentEvent(
      { type: "ignored", eventId: "evt_3" },
      stubAdmin({ session: null, capture }) as never,
    );

    expect(res.ok).toBe(true);
    expect(res.ignored).toBe(true);
    expect(capture.order).toBeUndefined();
  });
});
