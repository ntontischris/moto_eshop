import Link from "next/link";
import { ChevronRight, Star } from "lucide-react";
import type { ProductListItem } from "@/lib/queries/products";
import { SmartImage } from "./smart-image";
import { Badge, type Tone } from "./badge";
import { PriceDisplay } from "./price-display";
import { AvailabilityBadge } from "./availability-badge";
import { WishlistButton } from "./wishlist-button";
import { getAvailabilityState } from "../../_lib/availability";

interface ProductCardProps {
  product: ProductListItem;
  rank?: number;
  compact?: boolean;
}

export function ProductCard({ product, rank, compact = false }: ProductCardProps) {
  const href = `/product/${product.slug}`;
  const badges: { label: string; tone: Tone }[] = [];

  if (product.certification) badges.push({ label: product.certification, tone: "tech" });
  if (product.rider_type) badges.push({ label: product.rider_type, tone: "neutral" });

  const visibleBadges = badges.slice(0, compact ? 1 : 2);
  const rating =
    product.average_rating && product.review_count > 0
      ? product.average_rating.toFixed(1)
      : null;
  const availability = getAvailabilityState(product.stock);

  return (
    <article className={`v3-product-card${compact ? " is-compact" : ""}`}>
      <div className="v3-product-stage">
        <Link href={href} className="v3-product-image" aria-label={product.name}>
          {rank !== undefined && (
            <span className="v3-product-rank" aria-hidden="true">
              {String(rank).padStart(2, "0")}
            </span>
          )}
          <SmartImage
            src={product.primary_image_url}
            alt={product.primary_image_alt || product.name}
            sizes={compact ? "(max-width: 520px) 58vw, 220px" : "(max-width: 520px) 72vw, 280px"}
          />
        </Link>
        <WishlistButton slug={product.slug} />
      </div>

      <div className="v3-product-body">
        <div className="v3-product-topline">
          <Link href={`/search?q=${encodeURIComponent(product.brand)}`} className="v3-card__brand">
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
            <span>Νέα επιλογή</span>
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
          />
          <Link href={href} className="v3-card__cta">
            Δες προϊόν <ChevronRight size={16} aria-hidden="true" />
          </Link>
        </div>
      </div>
    </article>
  );
}
