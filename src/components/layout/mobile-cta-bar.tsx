"use client";

import { ShoppingCart, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface MobileCtaBarProps {
  price: number;
  originalPrice?: number;
  onAddToCart: () => void;
  onToggleWishlist?: () => void;
  isWishlisted?: boolean;
  isInStock?: boolean;
  className?: string;
}

const formatPrice = (amount: number): string =>
  new Intl.NumberFormat("el-GR", {
    style: "currency",
    currency: "EUR",
  }).format(amount);

export const MobileCtaBar = ({
  price,
  originalPrice,
  onAddToCart,
  onToggleWishlist,
  isWishlisted = false,
  isInStock = true,
  className,
}: MobileCtaBarProps) => {
  const hasDiscount = originalPrice !== undefined && originalPrice > price;
  const discountPct = hasDiscount
    ? Math.round(((originalPrice - price) / originalPrice) * 100)
    : 0;

  return (
    <div
      className={cn(
        "fixed bottom-16 left-0 right-0 z-40 border-t border-dark-3 bg-dark/95 px-4 py-3 backdrop-blur-sm md:hidden",
        className,
      )}
    >
      <div className="flex items-center gap-3">
        {/* Price block */}
        <div className="flex flex-col">
          <span className="text-lg font-bold text-white">
            {formatPrice(price)}
          </span>
          {hasDiscount && (
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-gray-500 line-through">
                {formatPrice(originalPrice)}
              </span>
              <span className="text-xs font-semibold text-amber-400">
                -{discountPct}%
              </span>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="ml-auto flex items-center gap-2">
          {onToggleWishlist && (
            <Button
              variant="outline-neutral"
              size="icon"
              onClick={onToggleWishlist}
              aria-label={
                isWishlisted ? "Αφαίρεση από Wishlist" : "Προσθήκη στη Wishlist"
              }
              className="shrink-0 border-dark-3"
            >
              <Heart
                className={cn(
                  "h-5 w-5",
                  isWishlisted && "fill-brand-red text-brand-red",
                )}
              />
            </Button>
          )}

          <Button
            variant="default"
            size="lg"
            onClick={onAddToCart}
            disabled={!isInStock}
            className="min-w-[140px] shrink-0"
          >
            <ShoppingCart className="h-4 w-4" />
            {isInStock ? "Προσθήκη" : "Εξαντλήθηκε"}
          </Button>
        </div>
      </div>
    </div>
  );
};
