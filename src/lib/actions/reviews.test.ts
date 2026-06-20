import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));

import { createClient } from "@/lib/supabase/server";
import { createReview } from "./reviews";

interface Insert {
  row?: Record<string, unknown>;
}

/**
 * Minimal fake of the user-scoped Supabase server client covering the two chains
 * createReview uses: orders (verified-purchase lookup) and reviews (insert).
 */
function makeClient(opts: {
  user: { id: string } | null;
  hasPurchase?: boolean;
  insert?: Insert;
  insertError?: boolean;
}) {
  const insert = opts.insert ?? {};
  return {
    auth: { getUser: async () => ({ data: { user: opts.user } }) },
    from(table: string) {
      if (table === "orders") {
        const chain = {
          select: () => chain,
          eq: () => chain,
          limit: () => chain,
          maybeSingle: async () => ({
            data: opts.hasPurchase ? { id: "order-1" } : null,
            error: null,
          }),
        };
        return chain;
      }
      // reviews
      return {
        insert: async (row: Record<string, unknown>) => {
          insert.row = row;
          return { error: opts.insertError ? { message: "db" } : null };
        },
      };
    },
  } as unknown as Awaited<ReturnType<typeof createClient>>;
}

const validInput = {
  productId: "550e8400-e29b-41d4-a716-446655440000",
  rating: 5,
  title: "Άριστο",
  body: "Πολύ καλό προϊόν, το συνιστώ ανεπιφύλακτα.",
};

beforeEach(() => vi.clearAllMocks());

describe("createReview", () => {
  it("rejects anonymous users", async () => {
    vi.mocked(createClient).mockResolvedValue(makeClient({ user: null }));
    const result = await createReview(validInput);
    expect(result).toEqual({ success: false, error: "Απαιτείται σύνδεση" });
  });

  it("marks the review verified when the user purchased the product", async () => {
    const insert: Insert = {};
    vi.mocked(createClient).mockResolvedValue(
      makeClient({ user: { id: "u1" }, hasPurchase: true, insert }),
    );

    const result = await createReview(validInput);

    expect(result).toEqual({ success: true });
    expect(insert.row).toMatchObject({
      product_id: validInput.productId,
      user_id: "u1",
      is_verified: true,
      status: "pending",
    });
  });

  it("inserts an unverified pending review when there is no purchase", async () => {
    const insert: Insert = {};
    vi.mocked(createClient).mockResolvedValue(
      makeClient({ user: { id: "u1" }, hasPurchase: false, insert }),
    );

    const result = await createReview(validInput);

    expect(result).toEqual({ success: true });
    expect(insert.row).toMatchObject({ is_verified: false, status: "pending" });
  });

  it("never trusts a client-supplied status or verified flag", async () => {
    const insert: Insert = {};
    vi.mocked(createClient).mockResolvedValue(
      makeClient({ user: { id: "u1" }, hasPurchase: false, insert }),
    );

    await createReview({
      ...validInput,
      // @ts-expect-error — fields outside the schema must be ignored
      status: "approved",
      is_verified: true,
    });

    expect(insert.row).toMatchObject({ is_verified: false, status: "pending" });
  });

  it("rejects ratings outside 1–5", async () => {
    vi.mocked(createClient).mockResolvedValue(
      makeClient({ user: { id: "u1" } }),
    );
    const result = await createReview({ ...validInput, rating: 6 });
    expect(result.success).toBe(false);
  });
});
