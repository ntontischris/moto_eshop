"use client";

import { Link } from "@/i18n/navigation";
import { useRef, useState } from "react";
import { Check } from "lucide-react";
import { useTranslations } from "next-intl";
import type { Product } from "@/lib/queries/products";
import type { SizeVariant } from "../../_lib/size-availability";
import { getAvailabilityState } from "../../_lib/availability";
import { getCartRecommendations } from "../../_lib/cart-recommendations";
import { useAddToCartFlight } from "../../_lib/use-add-to-cart-flight";
import { checkSizeAvailable } from "../../_lib/cart-stock";
import { useV3 } from "../shell/v3-provider";
import { PriceDisplay } from "../commerce/price-display";
import { Badge } from "../commerce/badge";
import { AvailabilityBadge } from "../commerce/availability-badge";
import { SizeSelector } from "./size-selector";

export function BuyBox({
  product,
  sizes,
}: {
  product: Product;
  sizes: SizeVariant[];
}) {
  const t = useTranslations("pdp");
  const { addToCart } = useV3();
  const { state: morph, trigger } = useAddToCartFlight();
  const ctaRef = useRef<HTMLButtonElement>(null);
  const sizeSectionRef = useRef<HTMLDivElement>(null);
  // `size` holds the raw [Size code] (authoritative for cart/stock/ERP), or
  // null when nothing is picked. The picker only renders for [Size variant]s.
  const [size, setSize] = useState<string | null>(null);
  // Set when the CTA is pressed without a size — nudges the picker, no error.
  const [needsSize, setNeedsSize] = useState(false);
  const hasSizes = sizes.length > 0;

  const pickSize = (code: string) => {
    setSize(code);
    setNeedsSize(false);
  };
  const availability = getAvailabilityState(product.stock);
  const image = product.images[0]?.url ?? "";
  const recommendations = getCartRecommendations([
    {
      name: product.name,
      brand: product.brand,
      slug: product.slug,
      categorySlug: product.category_slug,
    },
  ]).slice(0, 3);

  const badges: { label: string; tone: "tech" | "neutral" }[] = [];
  if (product.certification)
    badges.push({ label: product.certification, tone: "tech" });
  if (product.rider_type)
    badges.push({ label: product.rider_type, tone: "neutral" });

  const onAdd = () => {
    const button = ctaRef.current;
    if (!availability.isOrderable || !button) return;
    // Sized product with nothing picked: never a dead button — nudge the picker
    // with the «Διάλεξε μέγεθος» hint and scroll it into view, no error, no
    // auto-select.
    if (hasSizes && !size) {
      setNeedsSize(true);
      sizeSectionRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
      return;
    }
    // The morph + fly-to-cart wraps the presentation-only add (ADR 0001). For a
    // sized product we first re-validate the chosen [Size code] server-side so a
    // stale page can't oversell an out-of-stock size; a rejection throws and the
    // flight reverts to its error state.
    void trigger({ button, image }, async () => {
      if (hasSizes && size) {
        const { ok } = await checkSizeAvailable(product.id, size);
        if (!ok) throw new Error("size-unavailable");
      }
      addToCart({
        slug: product.slug,
        name: product.name,
        brand: product.brand,
        categorySlug: product.category_slug,
        price: product.price,
        size,
        image,
        qty: 1,
      });
    });
  };

  return (
    <div className="v3-bb v3-bb--apple">
      <p className="v3-bb-brand">{product.brand}</p>
      <h1>{product.name}</h1>

      <div className="v3-bb-meta">
        {product.sku && <span>{t("skuLabel", { sku: product.sku })}</span>}
        {product.average_rating != null && (
          <span>
            ★ {product.average_rating.toFixed(1)} ({product.review_count})
          </span>
        )}
      </div>

      <div className="v3-bb-price">
        <PriceDisplay
          price={product.price}
          compareAt={product.compare_at_price}
        />
      </div>

      {badges.length > 0 && (
        <div className="v3-bb-badges">
          {badges.map((badge) => (
            <Badge key={badge.label} label={badge.label} tone={badge.tone} />
          ))}
        </div>
      )}

      {/* S-4.4 bike-compatibility badge slot — inert (populated in S-4.4) */}
      <div
        className="v3-bb-compat"
        data-slot="compat-badge"
        aria-hidden="true"
      />

      {hasSizes && (
        <div
          ref={sizeSectionRef}
          className={`v3-bb-step${needsSize ? " is-needed" : ""}`}
        >
          <div className="v3-bb-step-head">
            <span>1</span>
            <div>
              <strong>{t("chooseSize")}</strong>
              <Link href="#size-guide">{t("sizeGuide")}</Link>
            </div>
          </div>
          <SizeSelector variants={sizes} value={size} onChange={pickSize} />
          {needsSize && (
            <p className="v3-bb-note v3-bb-note--warn" role="alert">
              {t("chooseSize")}
            </p>
          )}
        </div>
      )}

      <div className="v3-bb-step">
        <div className="v3-bb-step-head">
          <span>{hasSizes ? "2" : "1"}</span>
          <div>
            <strong>{t("availability")}</strong>
            <em>{availability.detailLabel}</em>
          </div>
        </div>
        <AvailabilityBadge stock={product.stock} />
      </div>

      <button
        ref={ctaRef}
        type="button"
        className={`v3-btn-primary v3-bb-cta v3-atc v3-atc--${morph}`}
        disabled={!availability.isOrderable || morph === "pending"}
        aria-busy={morph === "pending"}
        onClick={onAdd}
      >
        <span className="v3-atc__label">{availability.ctaLabel}</span>
        <span className="v3-atc__spinner" aria-hidden="true" />
        <span className="v3-atc__check" aria-hidden="true">
          <Check size={18} strokeWidth={3} />
        </span>
        {morph === "error" && (
          <span className="v3-atc__error" role="alert">
            {t("addError")}
          </span>
        )}
      </button>

      <section className="v3-bb-complete" aria-label={t("relatedProducts")}>
        <p className="v3-label">Complete your ride</p>
        <div className="v3-bb-complete-list">
          {recommendations.map((rec) => (
            <Link key={rec.title} href={rec.href}>
              <span>{rec.tag}</span>
              <strong>{rec.title}</strong>
            </Link>
          ))}
        </div>
      </section>

      <ul className="v3-bb-trust">
        <li>{t("trustDelivery")}</li>
        <li>{t("trustSizeReturn")}</li>
        <li>{t("trustSecure")}</li>
      </ul>

      {/* Mobile sticky add-to-cart bar (<768px, CSS-only reveal). Reuses the
          SAME `onAdd` flight as the primary CTA — no duplicate cart logic. */}
      <div className="v3-bb-stickybar" aria-hidden={!availability.isOrderable}>
        <span className="v3-bb-stickybar__price">
          <PriceDisplay
            price={product.price}
            compareAt={product.compare_at_price}
          />
        </span>
        <button
          type="button"
          className="v3-btn-primary v3-bb-stickybar__cta"
          disabled={!availability.isOrderable || morph === "pending"}
          aria-busy={morph === "pending"}
          onClick={onAdd}
        >
          {availability.ctaLabel}
        </button>
      </div>
    </div>
  );
}
