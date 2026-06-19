"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

type SimpleResult = { success: boolean };

/**
 * Resolve a product slug to its id (active products only) — the slug↔UUID
 * boundary (#133). The live storefront wishlist is slug-keyed; the `wishlists`
 * table is UUID-keyed.
 */
async function productIdForSlug(
  supabase: Awaited<ReturnType<typeof createClient>>,
  slug: string,
): Promise<string | null> {
  const { data } = await supabase
    .from("products")
    .select("id")
    .eq("slug", slug)
    .eq("status", "active")
    .maybeSingle();
  return data?.id ?? null;
}

/**
 * Write-through a single favourite for the logged-in user (#133). RLS enforces
 * own-row access. No-ops for guests (the provider only calls this when
 * account-backed) and for unknown slugs.
 */
export async function setWishlistItem(
  slug: string,
  on: boolean,
): Promise<SimpleResult> {
  if (!slug) return { success: false };
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false };

  const productId = await productIdForSlug(supabase, slug);
  if (!productId) return { success: false };

  if (on) {
    await supabase
      .from("wishlists")
      .upsert(
        { user_id: user.id, product_id: productId },
        { onConflict: "user_id,product_id", ignoreDuplicates: true },
      );
  } else {
    await supabase
      .from("wishlists")
      .delete()
      .eq("user_id", user.id)
      .eq("product_id", productId);
  }
  revalidatePath("/wishlist");
  return { success: true };
}

/**
 * Called by the storefront provider on load. A guest gets their local slugs back
 * unchanged (account:false). A logged-in user gets the [Guest wishlist] merged
 * (union) into the [Persisted wishlist] — slugs → ids, dup-safe upsert, unknown
 * slugs skipped — and the full persisted slug set back (account:true). The
 * provider clears the local store after an account result (#136). Mirrors the
 * guest-cart merge contract.
 */
export async function syncWishlistOnLoad(
  localSlugs: string[],
): Promise<{ account: boolean; slugs: string[] }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { account: false, slugs: localSlugs };

  if (localSlugs.length > 0) {
    const { data: prods } = await supabase
      .from("products")
      .select("id")
      .in("slug", localSlugs)
      .eq("status", "active");
    const rows = (prods ?? []).map((p) => ({
      user_id: user.id,
      product_id: p.id,
    }));
    if (rows.length > 0) {
      await supabase.from("wishlists").upsert(rows, {
        onConflict: "user_id,product_id",
        ignoreDuplicates: true,
      });
    }
  }

  const { data: saved } = await supabase
    .from("wishlists")
    .select("products ( slug )")
    .eq("user_id", user.id);
  const slugs = (saved ?? [])
    .map((r) => (r.products as unknown as { slug: string } | null)?.slug)
    .filter((s): s is string => Boolean(s));

  if (localSlugs.length > 0) revalidatePath("/wishlist");
  return { account: true, slugs };
}

export async function clearWishlist(): Promise<
  { success: true } | { success: false; error: string }
> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Απαιτείται σύνδεση" };

  await supabase.from("wishlists").delete().eq("user_id", user.id);
  revalidatePath("/wishlist");
  return { success: true };
}
