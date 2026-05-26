import { createClient } from "@/lib/supabase/server";
import type { StorefrontState } from "./types";
import type { ChatUserContextRow } from "@/types/database-augment";

export interface LoadStorefrontStateInput {
  locale: string;
  pathname: string;
  userId: string | null;
  sessionId: string;
  cartItemCount: number;
  cartTotalCents: number;
  currency: string;
}

/**
 * Reads chat_user_context + wishlist count for the current viewer.
 * Cart fields are passed in (the caller has them via existing cart cookie).
 */
export async function loadStorefrontState(
  input: LoadStorefrontStateInput,
): Promise<StorefrontState> {
  const supabase = await createClient();

  // chat_user_context is not in the generated DB types — cast through unknown.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;

  const ctxBase = db.from("chat_user_context").select("*");
  const ctxQueryFinal = input.userId
    ? ctxBase.eq("user_id", input.userId)
    : ctxBase.eq("session_id", input.sessionId).is("user_id", null);

  const { data: ctxRow } = (await ctxQueryFinal.maybeSingle()) as {
    data: ChatUserContextRow | null;
  };

  let wishlistCount = 0;
  if (input.userId) {
    const { data: wlData } = (await db
      .from("wishlist_items")
      .select("product_id", { count: "exact", head: true })
      .eq("user_id", input.userId)) as { data: { count?: number } | null };
    wishlistCount = wlData?.count ?? 0;
  }

  return {
    locale: input.locale,
    pathname: input.pathname,
    cart: {
      itemCount: input.cartItemCount,
      totalCents: input.cartTotalCents,
      currency: input.currency,
    },
    bike: ctxRow?.bike ?? null,
    wishlistCount,
    ridingStyle: ctxRow?.riding_style ?? null,
    notes: ctxRow?.notes ?? null,
  };
}
