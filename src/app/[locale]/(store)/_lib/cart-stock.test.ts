import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/supabase/admin", () => ({ createAdminClient: vi.fn() }));
import { createAdminClient } from "@/lib/supabase/admin";
import {
  checkSizeAvailable,
  checkSizeAvailableBySlug,
  getProductSizesBySlug,
} from "./cart-stock";

type Row = { size: string | null; available: number | null };

/**
 * Stub for the slug-based actions: `products` (maybeSingle) resolves slug → id,
 * then `v_product_available_stock` resolves the per-size rows.
 */
function stubBySlug(opts: {
  product: { id: string } | null;
  stock: Row[] | null;
  stockError?: { message: string } | null;
}) {
  return {
    from(table: string) {
      if (table === "products") {
        const chain = {
          select: () => chain,
          eq: () => chain,
          maybeSingle: async () => ({ data: opts.product, error: null }),
        };
        return chain;
      }
      const chain = {
        select: () => chain,
        eq: () => chain,
        then: (resolve: (r: { data: Row[] | null; error: unknown }) => void) =>
          resolve({ data: opts.stock, error: opts.stockError ?? null }),
      };
      return chain;
    },
  };
}

/**
 * Stub the `v_product_available_stock` read. The action chains
 * `.select().eq().eq()` then awaits, so the chain object is both chainable and
 * thenable and resolves the given `{ data, error }`.
 */
function stubStock(result: {
  data: Row[] | null;
  error: { message: string } | null;
}) {
  const chain = {
    select: () => chain,
    eq: () => chain,
    then: (resolve: (r: typeof result) => void) => resolve(result),
  };
  return { from: () => chain };
}

describe("checkSizeAvailable (server-authoritative per-size stock)", () => {
  beforeEach(() => vi.mocked(createAdminClient).mockReset());

  it("accepts a size that is in stock", async () => {
    vi.mocked(createAdminClient).mockReturnValue(
      stubStock({
        data: [{ size: "00M", available: 8 }],
        error: null,
      }) as never,
    );
    expect(await checkSizeAvailable("p1", "00M")).toEqual({ ok: true });
  });

  it("accepts a size with limited (1–3) stock", async () => {
    vi.mocked(createAdminClient).mockReturnValue(
      stubStock({
        data: [{ size: "044", available: 2 }],
        error: null,
      }) as never,
    );
    expect(await checkSizeAvailable("p1", "044")).toEqual({ ok: true });
  });

  it("rejects an out-of-stock size even if the client requests it", async () => {
    vi.mocked(createAdminClient).mockReturnValue(
      stubStock({
        data: [{ size: "0XL", available: 0 }],
        error: null,
      }) as never,
    );
    expect(await checkSizeAvailable("p1", "0XL")).toEqual({ ok: false });
  });

  it("rejects an unknown/stale size with no stock row (fail closed)", async () => {
    vi.mocked(createAdminClient).mockReturnValue(
      stubStock({ data: [], error: null }) as never,
    );
    expect(await checkSizeAvailable("p1", "00M")).toEqual({ ok: false });
  });

  it("fails closed on a read error", async () => {
    vi.mocked(createAdminClient).mockReturnValue(
      stubStock({ data: null, error: { message: "boom" } }) as never,
    );
    expect(await checkSizeAvailable("p1", "00M")).toEqual({ ok: false });
  });
});

describe("checkSizeAvailableBySlug (in-cart size change re-validation)", () => {
  beforeEach(() => vi.mocked(createAdminClient).mockReset());

  it("accepts an in-stock size for a resolved slug", async () => {
    vi.mocked(createAdminClient).mockReturnValue(
      stubBySlug({
        product: { id: "p1" },
        stock: [{ size: "00L", available: 6 }],
      }) as never,
    );
    expect(await checkSizeAvailableBySlug("jacket", "00L")).toEqual({
      ok: true,
    });
  });

  it("rejects switching into an out-of-stock size", async () => {
    vi.mocked(createAdminClient).mockReturnValue(
      stubBySlug({
        product: { id: "p1" },
        stock: [{ size: "00L", available: 0 }],
      }) as never,
    );
    expect(await checkSizeAvailableBySlug("jacket", "00L")).toEqual({
      ok: false,
    });
  });

  it("fails closed when the slug does not resolve", async () => {
    vi.mocked(createAdminClient).mockReturnValue(
      stubBySlug({ product: null, stock: null }) as never,
    );
    expect(await checkSizeAvailableBySlug("ghost", "00L")).toEqual({
      ok: false,
    });
  });
});

describe("getProductSizesBySlug (in-cart selector options)", () => {
  beforeEach(() => vi.mocked(createAdminClient).mockReset());

  it("returns the product's [Size variant]s for a known slug", async () => {
    vi.mocked(createAdminClient).mockReturnValue(
      stubBySlug({
        product: { id: "p1" },
        stock: [
          { size: "00M", available: 5 },
          { size: "00L", available: 0 },
        ],
      }) as never,
    );
    expect(await getProductSizesBySlug("jacket")).toEqual([
      { code: "00M", display: "M", available: 5, state: "available" },
      { code: "00L", display: "L", available: 0, state: "out" },
    ]);
  });

  it("returns no sizes for an unknown slug", async () => {
    vi.mocked(createAdminClient).mockReturnValue(
      stubBySlug({ product: null, stock: null }) as never,
    );
    expect(await getProductSizesBySlug("ghost")).toEqual([]);
  });
});
