import Link from "next/link";
import { ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getCartId } from "@/lib/cart/cookie";
import { getCart } from "@/lib/queries/cart";
import { CartItemRow } from "@/components/cart/cart-item-row";
import { CartSummary } from "@/components/cart/cart-summary";

export const metadata = { title: "Καλάθι | MotoMarket" };

export default async function CartPage() {
  const cartId = await getCartId();
  const cart = cartId ? await getCart(cartId) : null;
  const items = cart?.items ?? [];

  if (items.length === 0) {
    return (
      <main className="container mx-auto flex flex-col items-center justify-center px-4 py-24 text-center">
        <ShoppingCart className="mb-4 h-16 w-16 text-muted-foreground/30" />
        <h1 className="text-2xl font-bold">Το καλάθι σου είναι άδειο</h1>
        <p className="mt-2 text-muted-foreground">
          Ξεκίνα να προσθέτεις προϊόντα για να ολοκληρώσεις την παραγγελία σου.
        </p>
        <Button render={<Link href="/" />} className="mt-6">
          Ξεκίνα τις αγορές
        </Button>
      </main>
    );
  }

  return (
    <main className="container mx-auto px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">
        Καλάθι ({items.length} {items.length === 1 ? "προϊόν" : "προϊόντα"})
      </h1>

      <div className="flex flex-col gap-8 lg:flex-row">
        <div className="min-w-0 flex-1">
          {items.map((item) => (
            <CartItemRow key={item.id} item={item} />
          ))}
        </div>

        <div className="w-full shrink-0 lg:w-80">
          <CartSummary items={items} />
        </div>
      </div>
    </main>
  );
}
