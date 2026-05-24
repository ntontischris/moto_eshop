import { formatPrice, hasDiscount, discountPercent } from "../../_lib/format";
import { Badge } from "./badge";

interface PriceDisplayProps {
  price: number;
  compareAt: number | null;
}

export function PriceDisplay({ price, compareAt }: PriceDisplayProps) {
  const discounted = hasDiscount(price, compareAt);
  const pct = discounted ? discountPercent(price, compareAt) : 0;

  return (
    <div className="v3-price">
      <span
        className={discounted ? "v3-price-current is-discounted" : "v3-price-current"}
        aria-label={`Τιμή: ${formatPrice(price)}`}
      >
        {formatPrice(price)}
      </span>

      {discounted && compareAt !== null && (
        <>
          <span
            className="v3-price-compare"
            aria-label={`Αρχική τιμή: ${formatPrice(compareAt)}`}
          >
            {formatPrice(compareAt)}
          </span>

          <span aria-label={`Έκπτωση ${pct}%`}>
            <Badge label={`-${pct}%`} tone="promo" />
          </span>
        </>
      )}
    </div>
  );
}
