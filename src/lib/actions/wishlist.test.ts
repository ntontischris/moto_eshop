import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));

import { createClient } from "@/lib/supabase/server";
import { setWishlistItem, syncWishlistOnLoad } from "./wishlist";

interface Capture {
  upsert?: unknown;
  upsertOpts?: unknown;
  deleted?: boolean;
}

/**
 * Minimal fake of the user-scoped Supabase server client covering the chains the
 * wishlist actions use: products (maybeSingle for one slug, `.in` for many) and
 * wishlists (upsert / delete / select-back).
 */
function makeClient(opts: {
  user: { id: string } | null;
  productBySlug?: Record<string, string>;
  productsBySlugs?: { id: string }[];
  savedSlugs?: { slug: string }[];
  capture?: Capture;
}) {
  const capture = opts.capture ?? {};
  return {
    auth: { getUser: async () => ({ data: { user: opts.user } }) },
    from(table: string) {
      if (table === "products") {
        const rec: { slug?: string } = {};
        const chain = {
          select: () => chain,
          eq: (col: string, val: string) => {
            if (col === "slug") rec.slug = val;
            return chain;
          },
          in: () => chain,
          maybeSingle: async () => ({
            data:
              rec.slug && opts.productBySlug?.[rec.slug]
                ? { id: opts.productBySlug[rec.slug] }
                : null,
            error: null,
          }),
          then: (resolve: (r: unknown) => void) =>
            resolve({ data: opts.productsBySlugs ?? [], error: null }),
        };
        return chain;
      }
      // wishlists
      const delChain = {
        eq: () => delChain,
        then: (resolve: (r: unknown) => void) => {
          capture.deleted = true;
          resolve({ error: null });
        },
      };
      const selChain = {
        eq: () => selChain,
        then: (resolve: (r: unknown) => void) =>
          resolve({
            data: (opts.savedSlugs ?? []).map((s) => ({ products: s })),
            error: null,
          }),
      };
      return {
        upsert: async (rows: unknown, options: unknown) => {
          capture.upsert = rows;
          capture.upsertOpts = options;
          return { error: null };
        },
        delete: () => delChain,
        select: () => selChain,
      };
    },
  };
}

describe("setWishlistItem (logged-in write-through, #133)", () => {
  beforeEach(() => vi.mocked(createClient).mockReset());

  it("rejects a guest", async () => {
    vi.mocked(createClient).mockResolvedValue(
      makeClient({ user: null }) as never,
    );
    expect(await setWishlistItem("jacket", true)).toEqual({ success: false });
  });

  it("rejects an unknown slug", async () => {
    vi.mocked(createClient).mockResolvedValue(
      makeClient({ user: { id: "u1" }, productBySlug: {} }) as never,
    );
    expect(await setWishlistItem("ghost", true)).toEqual({ success: false });
  });

  it("upserts the resolved product on add (slug→UUID, dup-safe)", async () => {
    const capture: Capture = {};
    vi.mocked(createClient).mockResolvedValue(
      makeClient({
        user: { id: "u1" },
        productBySlug: { jacket: "p1" },
        capture,
      }) as never,
    );
    expect(await setWishlistItem("jacket", true)).toEqual({ success: true });
    expect(capture.upsert).toEqual({ user_id: "u1", product_id: "p1" });
    expect(capture.upsertOpts).toEqual({
      onConflict: "user_id,product_id",
      ignoreDuplicates: true,
    });
  });

  it("deletes the row on remove", async () => {
    const capture: Capture = {};
    vi.mocked(createClient).mockResolvedValue(
      makeClient({
        user: { id: "u1" },
        productBySlug: { jacket: "p1" },
        capture,
      }) as never,
    );
    expect(await setWishlistItem("jacket", false)).toEqual({ success: true });
    expect(capture.deleted).toBe(true);
  });
});

describe("syncWishlistOnLoad (merge-on-login, #136)", () => {
  beforeEach(() => vi.mocked(createClient).mockReset());

  it("passes guest slugs through unchanged (no account)", async () => {
    vi.mocked(createClient).mockResolvedValue(
      makeClient({ user: null }) as never,
    );
    expect(await syncWishlistOnLoad(["a", "b"])).toEqual({
      account: false,
      slugs: ["a", "b"],
    });
  });

  it("unions local guest slugs into the account and returns the merged set", async () => {
    const capture: Capture = {};
    vi.mocked(createClient).mockResolvedValue(
      makeClient({
        user: { id: "u1" },
        // local "jacket" resolves; "ghost" does not → skipped, no error
        productsBySlugs: [{ id: "p1" }],
        // account already had "gloves"; merged readback has both
        savedSlugs: [{ slug: "gloves" }, { slug: "jacket" }],
        capture,
      }) as never,
    );
    const res = await syncWishlistOnLoad(["jacket", "ghost"]);
    expect(res.account).toBe(true);
    expect(res.slugs).toEqual(["gloves", "jacket"]);
    // only the resolved id is upserted, dup-safe
    expect(capture.upsert).toEqual([{ user_id: "u1", product_id: "p1" }]);
    expect(capture.upsertOpts).toEqual({
      onConflict: "user_id,product_id",
      ignoreDuplicates: true,
    });
  });

  it("loads the persisted wishlist with no local items to merge", async () => {
    const capture: Capture = {};
    vi.mocked(createClient).mockResolvedValue(
      makeClient({
        user: { id: "u1" },
        savedSlugs: [{ slug: "gloves" }],
        capture,
      }) as never,
    );
    const res = await syncWishlistOnLoad([]);
    expect(res).toEqual({ account: true, slugs: ["gloves"] });
    // nothing to upsert when there are no local guest slugs
    expect(capture.upsert).toBeUndefined();
  });
});
