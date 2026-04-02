import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  formatPrice,
  calculateSubtotal,
  calculateAmountToFreeShipping,
  FREE_SHIPPING_THRESHOLD,
} from "@/lib/cart/utils";
import type { CartItem } from "@/lib/queries/cart";

interface CartSummaryProps {
  items: CartItem[];
}

export function CartSummary({ items }: CartSummaryProps) {
  const subtotal = calculateSubtotal(items);
  const amountToFree = calculateAmountToFreeShipping(subtotal);
  const hasFreeShipping = amountToFree === 0;
  const progressPercent = Math.min(
    100,
    (subtotal / FREE_SHIPPING_THRESHOLD) * 100,
  );

  return (
    <Card>
      <CardContent className="space-y-4 pt-6">
        <h2 className="text-lg font-semibold">Σύνοψη</h2>

        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Υποσύνολο</span>
            <span className="font-medium">{formatPrice(subtotal)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Αποστολή</span>
            <span className="font-medium">
              {hasFreeShipping ? (
                <span className="text-green-600">Δωρεάν</span>
              ) : (
                "Υπολογίζεται στο checkout"
              )}
            </span>
          </div>
        </div>

        {/* Free shipping progress */}
        <div className="space-y-1.5">
          <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-green-500 transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            {hasFreeShipping
              ? "Δωρεάν αποστολή!"
              : `Λείπουν ${formatPrice(amountToFree)} για δωρεάν αποστολή`}
          </p>
        </div>

        <div className="flex justify-between border-t pt-3">
          <span className="font-semibold">Σύνολο</span>
          <span className="text-lg font-bold">{formatPrice(subtotal)}</span>
        </div>

        <Button render={<Link href="/checkout" />} className="w-full" size="lg">
          Ολοκλήρωση Παραγγελίας
        </Button>

        <Link
          href="/"
          className="block text-center text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          Συνέχεια αγορών
        </Link>
      </CardContent>
    </Card>
  );
}
