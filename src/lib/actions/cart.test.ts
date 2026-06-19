import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));
vi.mock("@/lib/supabase/admin", () => ({ createAdminClient: vi.fn() }));
vi.mock("@/lib/cart/cookie", () => ({
  getCartId: vi.fn(async () => "c1"),
  setCartId: vi.fn(async () => undefined),
}));

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { addToCart, changeItemSize } from "./cart";

const ITEM_ID = "22222222-2222-4222-8222-222222222222";
const PRODUCT_ID = "11111111-1111-4111-8111-111111111111";

type StockRow = { size: string | null; available: number | null };
interface Line {
  id: string;
  cart_id: string;
  product_id: string;
  quantity: number;
  color: string | null;
  size: string | null;
}
interface Captures {
  update?: Record<string, unknown>;
  deleted?: boolean;
}

// Auth client (guest by default).
function stubAuth(user: { id: string } | null = null) {
  return { auth: { getUser: async () => ({ data: { user } }) } };
}

// Service-role client covering carts / cart_items / stock view. The cart_items
// `select` returns the line for the ownership + load reads and the target for
// the third read (the merge lookup).
function makeAdmin(opts: {
  stock?: StockRow[] | null;
  line?: Line | null;
  target?: { id: string; quantity: number } | null;
  captures?: Captures;
}) {
  const captures = opts.captures ?? {};
  let ciSelect = 0;
  return {
    from(table: string) {
      if (table === "v_product_available_stock") {
        const c: Record<string, unknown> = {
          select: () => c,
          eq: () => c,
          then: (resolve: (r: unknown) => void) =>
            resolve({ data: opts.stock ?? [], error: null }),
        };
        return c;
      }
      if (table === "carts") {
        const c: Record<string, unknown> = {
          select: () => c,
          eq: () => c,
          order: () => c,
          limit: () => c,
          maybeSingle: async () => ({ data: { id: "c1" }, error: null }),
        };
        return c;
      }
      if (table === "cart_items") {
        return {
          select: () => {
            const call = ciSelect++;
            const c: Record<string, unknown> = {
              eq: () => c,
              neq: () => c,
              is: () => c,
              maybeSingle: async () => ({
                data: call === 2 ? (opts.target ?? null) : (opts.line ?? null),
                error: null,
              }),
              then: (resolve: (r: unknown) => void) =>
                resolve({ data: [], error: null }),
            };
            return c;
          },
          update: (vals: Record<string, unknown>) => {
            captures.update = vals;
            return { eq: async () => ({ error: null }) };
          },
          delete: () => {
            captures.deleted = true;
            return { eq: async () => ({ error: null }) };
          },
        };
      }
      throw new Error(`unexpected table ${table}`);
    },
  };
}

const line = (over: Partial<Line> = {}): Line => ({
  id: "l1",
  cart_id: "c1",
  product_id: "p1",
  quantity: 2,
  color: null,
  size: "00M",
  ...over,
});

beforeEach(() => {
  vi.mocked(createClient).mockReset();
  vi.mocked(createAdminClient).mockReset();
  vi.mocked(createClient).mockResolvedValue(stubAuth() as never);
});

describe("addToCart — per-size stock guard (#134)", () => {
  it("rejects adding an out-of-stock size even if the client asks", async () => {
    vi.mocked(createAdminClient).mockReturnValue(
      makeAdmin({ stock: [{ size: "00M", available: 0 }] }) as never,
    );
    const res = await addToCart({
      productId: PRODUCT_ID,
      quantity: 1,
      unitPrice: 10,
      size: "00M",
    });
    expect(res.success).toBe(false);
  });
});

describe("changeItemSize (#135) — guarded, validated, merge-aware", () => {
  it("changes the size in place when no same-size line exists", async () => {
    const captures: Captures = {};
    vi.mocked(createAdminClient).mockReturnValue(
      makeAdmin({
        line: line(),
        target: null,
        stock: [{ size: "00L", available: 5 }],
        captures,
      }) as never,
    );
    const res = await changeItemSize({ cartItemId: ITEM_ID, size: "00L" });
    expect(res.success).toBe(true);
    expect(captures.update).toEqual({ size: "00L" });
    expect(captures.deleted).toBeUndefined();
  });

  it("merges quantities into an existing same-size line and drops this one", async () => {
    const captures: Captures = {};
    vi.mocked(createAdminClient).mockReturnValue(
      makeAdmin({
        line: line({ quantity: 2 }),
        target: { id: "l2", quantity: 3 },
        stock: [{ size: "00L", available: 5 }],
        captures,
      }) as never,
    );
    const res = await changeItemSize({ cartItemId: ITEM_ID, size: "00L" });
    expect(res.success).toBe(true);
    expect(captures.update).toEqual({ quantity: 5 });
    expect(captures.deleted).toBe(true);
  });

  it("rejects switching into an out-of-stock size", async () => {
    const captures: Captures = {};
    vi.mocked(createAdminClient).mockReturnValue(
      makeAdmin({
        line: line(),
        stock: [{ size: "00L", available: 0 }],
        captures,
      }) as never,
    );
    const res = await changeItemSize({ cartItemId: ITEM_ID, size: "00L" });
    expect(res.success).toBe(false);
    expect(captures.update).toBeUndefined();
  });

  it("is a no-op when the size is unchanged (no write)", async () => {
    const captures: Captures = {};
    vi.mocked(createAdminClient).mockReturnValue(
      makeAdmin({ line: line({ size: "00M" }), captures }) as never,
    );
    const res = await changeItemSize({ cartItemId: ITEM_ID, size: "00M" });
    expect(res.success).toBe(true);
    expect(captures.update).toBeUndefined();
  });

  it("rejects a cart item the caller does not own (anti-IDOR)", async () => {
    // Owned cart is c1, but the item lives in someone else's cart.
    vi.mocked(createAdminClient).mockReturnValue(
      makeAdmin({ line: line({ cart_id: "other" }) }) as never,
    );
    const res = await changeItemSize({ cartItemId: ITEM_ID, size: "00L" });
    expect(res.success).toBe(false);
  });
});
