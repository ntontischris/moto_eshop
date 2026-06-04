import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/supabase/admin", () => ({ createAdminClient: vi.fn() }));
import { createAdminClient } from "@/lib/supabase/admin";
import { placeOrder, type CheckoutInput } from "./actions";

interface Capture {
  order?: Record<string, unknown>;
  orderItems?: Array<Record<string, unknown>>;
}

function stubAdmin(opts: {
  products: Array<{
    id: string;
    slug: string;
    price: number;
    stock: number;
    status: string;
  }>;
  capture: Capture;
}) {
  return {
    from(table: string) {
      if (table === "products") {
        return {
          select: () => ({
            in: async () => ({ data: opts.products, error: null }),
          }),
        };
      }
      if (table === "orders") {
        return {
          insert: (row: Record<string, unknown>) => {
            opts.capture.order = row;
            return {
              select: () => ({
                single: async () => ({ data: { id: "order-1" }, error: null }),
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

const baseInput = (items: CheckoutInput["items"]): CheckoutInput => ({
  email: "a@b.gr",
  phone: "2100000000",
  fullName: "Test User",
  address: "Odos 1",
  city: "Athens",
  postal: "12345",
  region: "Attica",
  notes: "",
  payment: "cod",
  items,
});

describe("placeOrder (server-authoritative pricing)", () => {
  beforeEach(() => vi.mocked(createAdminClient).mockReset());

  it("ignores a tampered client price and uses the DB price", async () => {
    const capture: Capture = {};
    vi.mocked(createAdminClient).mockReturnValue(
      stubAdmin({
        products: [
          {
            id: "p-1",
            slug: "helmet",
            price: 200,
            stock: 5,
            status: "active",
          },
        ],
        capture,
      }) as never,
    );

    const res = await placeOrder(
      baseInput([{ slug: "helmet", name: "Helmet", qty: 1, price: 2 }]),
    );

    expect(res.ok).toBe(true);
    expect(capture.orderItems?.[0].unit_price).toBe(200);
    expect(capture.order?.total).toBe(200);
  });

  it("rejects an out-of-stock line without creating an order", async () => {
    const capture: Capture = {};
    vi.mocked(createAdminClient).mockReturnValue(
      stubAdmin({
        products: [
          { id: "p-1", slug: "helmet", price: 200, stock: 0, status: "active" },
        ],
        capture,
      }) as never,
    );

    const res = await placeOrder(
      baseInput([{ slug: "helmet", name: "Helmet", qty: 1, price: 200 }]),
    );

    expect(res.ok).toBe(false);
    expect(capture.order).toBeUndefined();
  });

  it("rejects invalid input (bad postal code)", async () => {
    const res = await placeOrder({
      ...baseInput([{ slug: "helmet", name: "H", qty: 1, price: 1 }]),
      postal: "12",
    });
    expect(res.ok).toBe(false);
  });
});
