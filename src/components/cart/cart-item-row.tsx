"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { Minus, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { updateQuantity, removeFromCart } from "@/lib/actions/cart";
import { useCart } from "@/lib/cart/cart-context";
import { formatPrice } from "@/lib/cart/utils";
import type { CartItem } from "@/lib/queries/cart";

interface CartItemRowProps {
  item: CartItem;
}

export function CartItemRow({ item }: CartItemRowProps) {
  const [isPending, startTransition] = useTransition();
  const { optimisticIncrement } = useCart();
  const [isRemoving, setIsRemoving] = useState(false);

  const lineTotal = item.unit_price * item.quantity;
  const href = `/${item.category_slug}/${item.product_slug}`;

  function handleUpdateQuantity(newQuantity: number) {
    const delta = newQuantity - item.quantity;
    optimisticIncrement(delta);

    startTransition(async () => {
      const result = await updateQuantity({
        cartItemId: item.id,
        quantity: newQuantity,
      });
      if (!result.success) {
        optimisticIncrement(-delta);
        toast.error(result.error);
      }
    });
  }

  function handleRemove() {
    setIsRemoving(true);
    optimisticIncrement(-item.quantity);

    startTransition(async () => {
      const result = await removeFromCart({ cartItemId: item.id });
      if (!result.success) {
        optimisticIncrement(item.quantity);
        setIsRemoving(false);
        toast.error(result.error);
      }
    });
  }

  if (isRemoving) return null;

  return (
    <div className="flex gap-4 border-b py-4 last:border-b-0">
      <Link
        href={href}
        className="relative h-24 w-24 shrink-0 overflow-hidden rounded-lg bg-muted"
      >
        <Image
          src={item.product_image_url}
          alt={item.product_image_alt}
          fill
          className="object-cover"
          sizes="96px"
        />
      </Link>

      <div className="flex min-w-0 flex-1 flex-col justify-between">
        <div>
          <Link
            href={href}
            className="line-clamp-2 text-sm font-medium hover:underline"
          >
            {item.product_name}
          </Link>
          {(item.size || item.color) && (
            <p className="mt-0.5 text-xs text-muted-foreground">
              {item.size && <span>Μέγεθος: {item.size}</span>}
              {item.size && item.color && <span> · </span>}
              {item.color && <span>Χρώμα: {item.color}</span>}
            </p>
          )}
          <p className="mt-0.5 text-sm text-muted-foreground">
            {formatPrice(item.unit_price)} / τεμ.
          </p>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              disabled={isPending || item.quantity <= 1}
              onClick={() => handleUpdateQuantity(item.quantity - 1)}
            >
              <Minus className="h-3 w-3" />
            </Button>
            <span className="w-8 text-center text-sm font-medium">
              {item.quantity}
            </span>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              disabled={isPending || item.quantity >= item.product_stock}
              onClick={() => handleUpdateQuantity(item.quantity + 1)}
            >
              <Plus className="h-3 w-3" />
            </Button>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold">
              {formatPrice(lineTotal)}
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-destructive"
              disabled={isPending}
              onClick={handleRemove}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
