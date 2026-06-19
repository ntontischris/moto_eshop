"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Heart } from "lucide-react";
import { setWishlistItem } from "@/lib/actions/wishlist";

/**
 * Remove-from-wishlist control for the account wishlist page. Uses the unified
 * slug-based wishlist server action (the same write-through the storefront heart
 * uses), replacing the retired legacy UUID button.
 */
export function WishlistRemove({
  slug,
  className,
}: {
  slug: string;
  className?: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      className={className}
      disabled={pending}
      aria-label="Αφαίρεση από τα αγαπημένα"
      onClick={() =>
        startTransition(async () => {
          await setWishlistItem(slug, false);
          router.refresh();
        })
      }
    >
      <Heart fill="currentColor" aria-hidden="true" />
    </button>
  );
}
