import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/supabase/admin", () => ({ createAdminClient: vi.fn() }));
import { createAdminClient } from "@/lib/supabase/admin";
import { resolveCheckoutSession } from "./actions";

function stubAdmin(opts: {
  session: Record<string, unknown> | null;
  order?: Record<string, unknown> | null;
}) {
  return {
    from(table: string) {
      if (table === "checkout_sessions") {
        return {
          select: () => ({
            eq: () => ({
              maybeSingle: async () => ({ data: opts.session, error: null }),
            }),
          }),
        };
      }
      if (table === "orders") {
        return {
          select: () => ({
            eq: () => ({
              maybeSingle: async () => ({
                data: opts.order ?? null,
                error: null,
              }),
            }),
          }),
        };
      }
      throw new Error(`unexpected table ${table}`);
    },
  };
}

describe("resolveCheckoutSession", () => {
  beforeEach(() => vi.mocked(createAdminClient).mockReset());

  it("returns completed with the order number once the webhook created the order", async () => {
    vi.mocked(createAdminClient).mockReturnValue(
      stubAdmin({
        session: { status: "completed", order_id: "order-1" },
        order: { order_number: "MM-ABC", total: 205 },
      }) as never,
    );

    const res = await resolveCheckoutSession("our-session-1");
    expect(res).toEqual({
      status: "completed",
      orderNumber: "MM-ABC",
      total: 205,
    });
  });

  it("returns pending while the session is still awaiting the webhook", async () => {
    vi.mocked(createAdminClient).mockReturnValue(
      stubAdmin({ session: { status: "pending", order_id: null } }) as never,
    );

    const res = await resolveCheckoutSession("our-session-1");
    expect(res.status).toBe("pending");
  });

  it("returns not_found for an unknown session", async () => {
    vi.mocked(createAdminClient).mockReturnValue(
      stubAdmin({ session: null }) as never,
    );

    const res = await resolveCheckoutSession("nope");
    expect(res.status).toBe("not_found");
  });
});
