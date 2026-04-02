"use client";

import { useState } from "react";
import { ShoppingCart, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AddToCartButtonProps {
  productId: string;
  disabled?: boolean;
}

export function AddToCartButton({
  productId,
  disabled = false,
}: AddToCartButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleAddToCart = async () => {
    setIsLoading(true);
    // TODO(Plan 1G): wire up cart action
    void productId;
    await new Promise((resolve) => setTimeout(resolve, 400));
    setIsLoading(false);
  };

  return (
    <Button
      size="lg"
      className="w-full gap-2 text-base"
      disabled={disabled || isLoading}
      onClick={handleAddToCart}
    >
      {isLoading ? (
        <Loader2 className="h-5 w-5 animate-spin" />
      ) : (
        <ShoppingCart className="h-5 w-5" />
      )}
      {disabled ? "Μη διαθέσιμο" : "Προσθήκη στο καλάθι"}
    </Button>
  );
}
