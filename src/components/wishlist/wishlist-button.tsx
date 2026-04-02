"use client";

import { useOptimistic, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Heart } from "lucide-react";
import { toggleWishlist } from "@/lib/actions/wishlist";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface WishlistButtonProps {
  productId: string;
  initialWishlisted: boolean;
  isLoggedIn: boolean;
  className?: string;
}

export function WishlistButton({
  productId,
  initialWishlisted,
  isLoggedIn,
  className,
}: WishlistButtonProps) {
  const router = useRouter();
  const [optimistic, setOptimistic] = useOptimistic(initialWishlisted);
  const [isPending, startTransition] = useTransition();

  function handleClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();

    if (!isLoggedIn) {
      router.push(
        `/login?next=${encodeURIComponent(window.location.pathname)}`,
      );
      return;
    }

    startTransition(async () => {
      setOptimistic(!optimistic);
      await toggleWishlist(productId);
    });
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      className={cn("h-9 w-9 rounded-full", className)}
      onClick={handleClick}
      disabled={isPending}
      aria-label={
        optimistic ? "Αφαίρεση από αγαπημένα" : "Προσθήκη στα αγαπημένα"
      }
    >
      <Heart
        className={cn(
          "h-5 w-5 transition-colors",
          optimistic ? "fill-red-500 text-red-500" : "text-muted-foreground",
        )}
      />
    </Button>
  );
}
