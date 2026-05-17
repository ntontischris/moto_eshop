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
    <>
      <style precedence="default">{`
        .v3-card {
          position: relative;
          display: flex;
          flex-direction: column;
          background: var(--v3-surface);
          border: 1px solid var(--v3-line);
          font-family: var(--v3-font);
          clip-path: polygon(0 0, 100% 0, 100% calc(100% - 18px),
            calc(100% - 18px) 100%, 0 100%);
          transition: border-color .18s, box-shadow .18s,
            transform .18s;
        }
        .v3-card::before {
          content: "";
          position: absolute; top: 0; left: 0; height: 3px;
          width: 0; background: var(--v3-red);
          transition: width .22s ease; z-index: 3;
        }
        .v3-card:hover {
          border-color: rgba(245,243,238,0.16);
          box-shadow: var(--v3-shadow);
          transform: translateY(-3px);
        }
        .v3-card:hover::before { width: 46%; }
        @media (prefers-reduced-motion: reduce) {
          .v3-card { transition: none; }
          .v3-card:hover { transform: none; }
          .v3-card::before { transition: none; }
        }
        .v3-card__img-wrap {
          position: relative;
          aspect-ratio: 4 / 5;
          background: var(--v3-graphite);
          overflow: hidden;
          flex-shrink: 0;
          border-bottom: 1px solid var(--v3-line);
        }
        .v3-card__img-wrap img {
          object-fit: cover;
          transition: transform .22s ease;
        }
        .v3-card:hover .v3-card__img-wrap img {
          transform: scale(1.04);
        }
        @media (prefers-reduced-motion: reduce) {
          .v3-card__img-wrap img { transition: none; }
          .v3-card:hover .v3-card__img-wrap img { transform: none; }
        }
        .v3-card__body {
          display: flex;
          flex-direction: column;
          gap: 6px;
          padding: 12px 14px 14px;
          flex: 1;
        }
        .v3-card__brand {
          font-family: var(--v3-display);
          font-size: 0.74rem;
          font-weight: 800;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          color: var(--v3-red);
          margin: 0;
        }
        .v3-card__name {
          font-family: var(--v3-display);
          font-size: 1.02rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: -0.005em;
          color: var(--v3-bone);
          margin: 0;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
          line-height: 1.12;
        }
        .v3-card__badges {
          display: flex;
          flex-wrap: wrap;
          gap: 4px;
          margin-top: 2px;
        }
        .v3-card__footer {
          margin-top: auto;
          padding-top: 8px;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .v3-card__cta {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 11px 14px;
          background: transparent;
          color: var(--v3-bone);
          font-family: var(--v3-display);
          font-size: 0.82rem;
          font-weight: 800;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          text-decoration: none;
          border: 1px solid var(--v3-line);
          cursor: pointer;
          transition: background .15s, border-color .15s, color .15s;
          margin-top: 6px;
        }
        .v3-card__cta span { color: var(--v3-red); transition: transform .15s; }
        .v3-card__cta:hover {
          background: var(--v3-red); color: #fff; border-color: var(--v3-red);
        }
        .v3-card__cta:hover span { color: #fff; transform: translateX(4px); }
        .v3-card__cta:focus-visible {
          outline: 2px solid var(--v3-cyan);
          outline-offset: 2px;
        }
        @media (prefers-reduced-motion: reduce) {
          .v3-card__cta { transition: none; }
        }
      `}</style>

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
    </>
  );
}
