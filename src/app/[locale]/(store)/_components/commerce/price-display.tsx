"use client";

import { useTranslations } from "next-intl";
import { formatPrice, hasDiscount, discountPercent } from "../../_lib/format";
import { Badge } from "./badge";
import { PriceOdometer } from "./price-odometer";

interface PriceDisplayProps {
  price: number;
  compareAt: number | null;
  /** When true (fine pointer, not reduced-motion), the current price digits
      roll up like an odometer. Presentation only — never changes the value. */
  rolling?: boolean;
}

export function PriceDisplay({
  price,
  compareAt,
  rolling = false,
}: PriceDisplayProps) {
  const t = useTranslations("pdp");
  const discounted = hasDiscount(price, compareAt);
  const pct = discounted ? discountPercent(price, compareAt) : 0;
  const formatted = formatPrice(price);

  return (
    <div className="v3-price">
      <span
        className={
          discounted ? "v3-price-current is-discounted" : "v3-price-current"
        }
        aria-label={t("priceLabel", { price: formatted })}
      >
        <PriceOdometer formatted={formatted} rolling={rolling} />
      </span>

      {discounted && compareAt !== null && (
        <>
          <span
            className="v3-price-compare"
            aria-label={t("originalPriceLabel", {
              price: formatPrice(compareAt),
            })}
          >
            {formatPrice(compareAt)}
          </span>

          <span aria-label={t("discountLabel", { pct })}>
            <Badge label={`-${pct}%`} tone="promo" />
          </span>
        </>
      )}
    </div>
  );
}
