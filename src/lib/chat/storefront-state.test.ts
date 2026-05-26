import { describe, it, expect, vi, beforeEach } from "vitest";
import { loadStorefrontState } from "./storefront-state";

const supabaseMock = {
  from: vi.fn(),
};

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => supabaseMock),
}));

describe("loadStorefrontState", () => {
  beforeEach(() => {
    supabaseMock.from.mockReset();
  });

  it("returns defaults for an anonymous session with no cart/bike/wishlist", async () => {
    supabaseMock.from.mockImplementation((_table: string) => {
      const q = {
        select: () => q,
        eq: () => q,
        is: () => q,
        maybeSingle: async () => ({ data: null }),
        single: async () => ({ data: null, error: null }),
      };
      return q as never;
    });

    const out = await loadStorefrontState({
      locale: "el",
      pathname: "/",
      userId: null,
      sessionId: "anon_abc",
      cartItemCount: 0,
      cartTotalCents: 0,
      currency: "EUR",
    });

    expect(out).toMatchObject({
      locale: "el",
      pathname: "/",
      cart: { itemCount: 0, totalCents: 0, currency: "EUR" },
      bike: null,
      wishlistCount: 0,
      ridingStyle: null,
      notes: null,
    });
  });

  it("loads bike + riding_style + notes from chat_user_context when present", async () => {
    supabaseMock.from.mockImplementation((table: string) => {
      const q = {
        select: () => q,
        eq: () => q,
        is: () => q,
        maybeSingle: async () => {
          if (table === "chat_user_context") {
            return {
              data: {
                bike: { brand: "Yamaha", model: "MT-09", year: 2023, cc: 890 },
                riding_style: "touring",
                notes: "Προτιμά μαύρα.",
              },
            };
          }
          return { data: null };
        },
        single: async () => ({ data: null, error: null }),
      };
      return q as never;
    });

    const out = await loadStorefrontState({
      locale: "el",
      pathname: "/product/foo",
      userId: "user_1",
      sessionId: "sess_1",
      cartItemCount: 2,
      cartTotalCents: 24999,
      currency: "EUR",
    });

    expect(out.bike?.brand).toBe("Yamaha");
    expect(out.ridingStyle).toBe("touring");
    expect(out.notes).toContain("μαύρα");
  });
});
