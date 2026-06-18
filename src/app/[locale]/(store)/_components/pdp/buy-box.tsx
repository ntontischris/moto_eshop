"use client";

import { Link } from "@/i18n/navigation";
import { useMemo, useRef, useState } from "react";
import { Check } from "lucide-react";
import { useTranslations } from "next-intl";
import type { Product } from "@/lib/queries/products";
import { getAvailabilityState } from "../../_lib/availability";
import { getCartRecommendations } from "../../_lib/cart-recommendations";
import { useAddToCartFlight } from "../../_lib/use-add-to-cart-flight";
import { useV3 } from "../shell/v3-provider";
import { PriceDisplay } from "../commerce/price-display";
import { Badge } from "../commerce/badge";
import { AvailabilityBadge } from "../commerce/availability-badge";
import { SizeSelector } from "./size-selector";

const FALLBACK_SIZES = ["XS", "S", "M", "L", "XL", "XXL"];

function deriveSizes(specs: Record<string, string>): {
  sizes: string[];
  fromSpecs: boolean;
} {
  const key = Object.keys(specs).find((k) => /μέγεθ|size/i.test(k));
  if (key && specs[key]) {
    const list = specs[key]
      .split(/[,/|]/)
      .map((s) => s.trim())
      .filter(Boolean);
    if (list.length > 0) return { sizes: list, fromSpecs: true };
  }
  return { sizes: FALLBACK_SIZES, fromSpecs: false };
}

export function BuyBox({ product }: { product: Product }) {
  const t = useTranslations("pdp");
  const { addToCart } = useV3();
  const { state: morph, trigger } = useAddToCartFlight();
  const ctaRef = useRef<HTMLButtonElement>(null);
  const { sizes, fromSpecs } = useMemo(
    () => deriveSizes(product.specs ?? {}),
    [product.specs],
  );
  const [size, setSize] = useState<string | null>(null);
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
    // The morph + fly-to-cart wraps the EXISTING presentation-only add (ADR
    // 0001) — `addToCart` is the unchanged cart commit; the flight only
    // animates around its success.
    void trigger({ button, image }, () =>
      addToCart({
        slug: product.slug,
        name: product.name,
        brand: product.brand,
        categorySlug: product.category_slug,
        price: product.price,
        size,
        image,
        qty: 1,
      }),
    );
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

      <div className="v3-bb-step">
        <div className="v3-bb-step-head">
          <span>1</span>
          <div>
            <strong>{t("chooseSize")}</strong>
            <Link href="#size-guide">{t("sizeGuide")}</Link>
          </div>
        </div>
        <SizeSelector sizes={sizes} value={size} onChange={setSize} />
        {!fromSpecs && <p className="v3-bb-note">{t("sizesNote")}</p>}
      </div>

      <div className="v3-bb-step">
        <div className="v3-bb-step-head">
          <span>2</span>
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
