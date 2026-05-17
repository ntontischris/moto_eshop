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
    <div
      style={{
        display: "flex",
        alignItems: "baseline",
        gap: "8px",
        flexWrap: "wrap",
        fontFamily: "var(--v3-font)",
      }}
    >
      {/* Current price — always prominent */}
      <span
        style={{
          fontSize: "1.1rem",
          fontWeight: 700,
          color: discounted ? "var(--v3-red)" : "var(--v3-bone)",
          lineHeight: 1.2,
        }}
        aria-label={`Τιμή: ${formatPrice(price)}`}
      >
        {formatPrice(price)}
      </span>

      {discounted && compareAt !== null && (
        <>
          {/* Struck-through original price */}
          <span
            style={{
              fontSize: "0.85rem",
              fontWeight: 400,
              color: "var(--v3-bone-dim)",
              textDecoration: "line-through",
              lineHeight: 1.2,
            }}
            aria-label={`Αρχική τιμή: ${formatPrice(compareAt)}`}
          >
            {formatPrice(compareAt)}
          </span>

          {/* Discount percentage pill */}
          <span aria-label={`Έκπτωση ${pct}%`}>
            <Badge label={`-${pct}%`} tone="promo" />
          </span>
        </>
      )}
    </div>
  );
}
