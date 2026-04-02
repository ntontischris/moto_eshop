"use client";

import { useState } from "react";
import { ShoppingCart, Check, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useCart } from "@/lib/cart/cart-context";
import { addToCart } from "@/lib/actions/cart";

interface AddToCartButtonProps {
  productId: string;
  productName: string;
  unitPrice: number;
  stock: number;
  size?: string | null;
  color?: string | null;
  quantity?: number;
  className?: string;
}

type ButtonState = "idle" | "loading" | "success";

export function AddToCartButton({
  productId,
  productName,
  unitPrice,
  stock,
  size,
  color,
  quantity = 1,
  className,
}: AddToCartButtonProps) {
  const [state, setState] = useState<ButtonState>("idle");
  const { optimisticIncrement } = useCart();

  const isOutOfStock = stock <= 0;

  async function handleAddToCart() {
    if (state === "loading" || isOutOfStock) return;

    setState("loading");
    optimisticIncrement(quantity);

    const result = await addToCart({
      productId,
      quantity,
      unitPrice,
      size: size ?? null,
      color: color ?? null,
    });

    if (result.success) {
      setState("success");
      toast.success(`${productName} προστέθηκε στο καλάθι`);
      setTimeout(() => setState("idle"), 2000);
    } else {
      setState("idle");
      optimisticIncrement(-quantity);
      toast.error(result.error);
    }
  }

  return (
    <Button
      size="lg"
      className={`w-full gap-2 text-base ${className ?? ""}`}
      disabled={isOutOfStock || state === "loading"}
      onClick={handleAddToCart}
    >
      {state === "loading" && <Loader2 className="h-5 w-5 animate-spin" />}
      {state === "success" && <Check className="h-5 w-5" />}
      {state === "idle" && <ShoppingCart className="h-5 w-5" />}
      {isOutOfStock
        ? "Μη διαθέσιμο"
        : state === "success"
          ? "Προστέθηκε!"
          : "Προσθήκη στο καλάθι"}
    </Button>
  );
}
