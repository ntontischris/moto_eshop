"use client";

import { Link } from "@/i18n/navigation";
import { ChevronRight, Star } from "lucide-react";
import { useTranslations } from "next-intl";
import type { ProductListItem } from "@/lib/queries/products";
import { SmartImage } from "./smart-image";
import { Badge, type Tone } from "./badge";
import { PriceDisplay } from "./price-display";
import { AvailabilityBadge } from "./availability-badge";
import { WishlistButton } from "./wishlist-button";
import { getAvailabilityState } from "../../_lib/availability";
import { productPath } from "../../_lib/urls";
import { useCardInteractions } from "../../_lib/use-card-interactions";

interface ProductCardProps {
  product: ProductListItem;
  rank?: number;
  compact?: boolean;
}

export function ProductCard({
  product,
  rank,
  compact = false,
}: ProductCardProps) {
  const tPlp = useTranslations("plp");
  const tCommon = useTranslations("common");
  const href = productPath(product.category_path, product.slug);
  const gallery = product.gallery_image_urls ?? [];
  const primaryImage = gallery[0] ?? product.primary_image_url;
  // Hover/focus swaps to the SECOND image with a crossfade when one exists;
  // single-image products fall back to a gentle zoom on the only photo.
  const swapImage = gallery.length > 1 ? gallery[1] : null;

  const { cardRef, hot, handlers } = useCardInteractions();

  const badges: { label: string; tone: Tone }[] = [];
  if (product.certification)
    badges.push({ label: product.certification, tone: "tech" });
  if (product.rider_type)
    badges.push({ label: product.rider_type, tone: "neutral" });
  const visibleBadges = badges.slice(0, compact ? 1 : 2);

  const rating =
    product.average_rating && product.review_count > 0
      ? product.average_rating.toFixed(1)
      : null;
  const availability = getAvailabilityState(product.stock);
  const sizes = compact
    ? "(max-width: 520px) 58vw, 220px"
    : "(max-width: 520px) 72vw, 280px";

  return (
    <article
      ref={cardRef}
      className={`v3-product-card${compact ? " is-compact" : ""}${swapImage ? "" : " is-zoom"}${hot ? " is-hot" : ""}`}
      {...handlers}
    >
      <div className="v3-product-stage">
        <Link
          href={href}
          className="v3-product-image"
          aria-label={product.name}
        >
          {rank !== undefined && (
            <span className="v3-product-rank" aria-hidden="true">
              {String(rank).padStart(2, "0")}
            </span>
          )}
          <span className="v3-product-shot v3-product-shot--primary">
            <SmartImage
              src={primaryImage}
              alt={product.primary_image_alt || product.name}
              sizes={sizes}
            />
          </span>
          {swapImage && (
            <span
              className="v3-product-shot v3-product-shot--swap"
              aria-hidden="true"
            >
              {/* Mounts only on first hover/focus so the grid never preloads a
                  second image for every product the visitor scrolls past. */}
              {hot && <SmartImage src={swapImage} alt="" sizes={sizes} />}
            </span>
          )}
        </Link>
        <WishlistButton slug={product.slug} />
      </div>

      <div className="v3-product-body">
        <div className="v3-product-topline">
          <Link
            href={`/search?q=${encodeURIComponent(product.brand)}`}
            className="v3-card__brand"
          >
            {product.brand}
          </Link>
          <AvailabilityBadge stock={product.stock} />
        </div>

        <h3 className="v3-product-name">
          <Link href={href}>{product.name}</Link>
        </h3>

        <div className="v3-product-meta">
          {rating ? (
            <span>
              <Star size={13} aria-hidden="true" />
              {rating} ({product.review_count})
            </span>
          ) : (
            <span>{tPlp("newChoice")}</span>
          )}
          <span>{availability.detailLabel}</span>
        </div>

        {visibleBadges.length > 0 && (
          <div className="v3-card__badges">
            {visibleBadges.map((b) => (
              <Badge key={b.label} label={b.label} tone={b.tone} />
            ))}
          </div>
        )}

        <div className="v3-product-buy">
          <PriceDisplay
            price={product.price}
            compareAt={product.compare_at_price}
            rolling={hot}
          />
          <Link href={href} className="v3-card__cta">
            {tCommon("viewProduct")}
            <ChevronRight size={16} aria-hidden="true" />
          </Link>
        </div>
      </div>
    </article>
  );
}
