"use client";

import { AddToCartButton } from "@/components/cart/add-to-cart-button";
import { PriceDisplay } from "@/components/ui/price-display";

interface Props {
  productId: string;
  productName: string;
  price: number;
  compareAtPrice: number | null;
  stock: number;
}

export function MobileCtaBar(props: Props) {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-neutral-800 bg-[#0a0a0a]/95 p-3 backdrop-blur lg:hidden">
      <div className="container mx-auto flex items-center gap-3">
        <div className="flex-shrink-0">
          <PriceDisplay
            price={props.price}
            compareAtPrice={props.compareAtPrice}
            size="md"
          />
        </div>
        <div className="flex-1">
          <AddToCartButton
            productId={props.productId}
            productName={props.productName}
            unitPrice={props.price}
            stock={props.stock}
          />
        </div>
      </div>
    </div>
  );
}
