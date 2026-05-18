import Link from "next/link";
import type { ProductListItem } from "@/lib/queries/products";
import { SmartImage } from "./smart-image";
import { Badge, type Tone } from "./badge";
import { PriceDisplay } from "./price-display";
import { AvailabilityBadge } from "./availability-badge";
import { WishlistButton } from "./wishlist-button";

/* ── ProductCard (Server Component — WishlistButton is a separate client island) ── */

interface ProductCardProps {
  product: ProductListItem;
}

export function ProductCard({ product }: ProductCardProps) {
  const href = `/product/${product.slug}`;

  /* Badges — only from real fields, no fabrication */
  const badges: { label: string; tone: Tone }[] = [];
  if (product.certification) {
    badges.push({ label: product.certification, tone: "tech" });
  }
  if (product.rider_type) {
    badges.push({ label: product.rider_type, tone: "neutral" });
  }
  const visibleBadges = badges.slice(0, 3);

  return (
    <article className="v3-card">
      {/* Image area — fixed aspect ratio, zero CLS */}
      <div className="v3-card__img-wrap">
        <SmartImage
          src={product.primary_image_url}
          alt={product.primary_image_alt || product.name}
          sizes="(max-width: 480px) 50vw, 240px"
        />
        <WishlistButton slug={product.slug} />
      </div>

      <div className="v3-card__body">
        {/* Brand */}
        <p className="v3-card__brand">{product.brand}</p>

        {/* Name — 2-line clamp */}
        <p className="v3-card__name">{product.name}</p>

        {/* Feature badges — real fields only */}
        {visibleBadges.length > 0 && (
          <div className="v3-card__badges">
            {visibleBadges.map((b) => (
              <Badge key={b.label} label={b.label} tone={b.tone} />
            ))}
          </div>
        )}

        <div className="v3-card__footer">
          <PriceDisplay
            price={product.price}
            compareAt={product.compare_at_price}
          />
          <AvailabilityBadge stock={product.stock} />

          <Link href={href} className="v3-card__cta">
            Δες προϊόν <span aria-hidden="true">→</span>
          </Link>
        </div>
      </div>
    </article>
  );
}
