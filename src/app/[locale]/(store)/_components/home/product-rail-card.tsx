"use client";

import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import type { ProductListItem } from "@/lib/queries/products";
import { AvailabilityBadge } from "../commerce/availability-badge";
import { PriceDisplay } from "../commerce/price-display";
import { SmartImage } from "../commerce/smart-image";
import { WishlistButton } from "../commerce/wishlist-button";
import { productPath } from "../../_lib/urls";
import { useCardInteractions } from "../../_lib/use-card-interactions";

const SIZES = "(max-width: 680px) 72vw, (max-width: 1180px) 34vw, 272px";

export function ProductRailCard({
  product,
  rank,
}: {
  product: ProductListItem;
  rank: number;
}) {
  const t = useTranslations("home");
  const gallery = product.gallery_image_urls ?? [];
  const primaryImage = gallery[0] ?? product.primary_image_url;
  // Hover/focus crossfades to the SECOND image when one exists; single-image
  // products zoom the only photo instead of faking a swap.
  const swapImage = gallery.length > 1 ? gallery[1] : null;

  const { cardRef, hot, handlers } = useCardInteractions();

  const productHref = productPath(product.category_path, product.slug);

  return (
    <article
      ref={cardRef}
      className={`v3-gallery-card${swapImage ? "" : " is-zoom"}${hot ? " is-hot" : ""}`}
      {...handlers}
    >
      <div className="v3-gallery-plate">
        <span className="v3-gallery-rank" aria-hidden="true">
          {String(rank).padStart(2, "0")}
        </span>
        <Link href={productHref} aria-label={product.name}>
          <span className="v3-gallery-shot v3-gallery-shot--primary">
            <SmartImage
              src={primaryImage}
              alt={product.primary_image_alt || product.name}
              sizes={SIZES}
            />
          </span>
          {swapImage && (
            <span
              className="v3-gallery-shot v3-gallery-shot--swap"
              aria-hidden="true"
            >
              {/* Mounts only on first hover/focus so the rail never preloads a
                  second image for all 16 products at once. */}
              {hot && <SmartImage src={swapImage} alt="" sizes={SIZES} />}
            </span>
          )}
        </Link>
        <WishlistButton slug={product.slug} />
      </div>

      <div className="v3-gallery-info">
        <div className="v3-gallery-topline">
          <Link
            href={`/search?q=${encodeURIComponent(product.brand)}`}
            className="v3-card__brand"
          >
            {product.brand}
          </Link>
          <AvailabilityBadge stock={product.stock} />
        </div>

        <h3 className="v3-gallery-name">
          <Link href={productHref}>{product.name}</Link>
        </h3>

        <div className="v3-gallery-footer">
          <PriceDisplay
            price={product.price}
            compareAt={product.compare_at_price}
            rolling={hot}
          />
          <Link href={productHref} className="v3-gallery-cta">
            {t("railViewProduct")}
          </Link>
        </div>
      </div>
    </article>
  );
}
