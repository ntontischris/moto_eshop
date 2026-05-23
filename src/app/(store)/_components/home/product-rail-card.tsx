"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import type { ProductListItem } from "@/lib/queries/products";
import { AvailabilityBadge } from "../commerce/availability-badge";
import { PriceDisplay } from "../commerce/price-display";
import { SmartImage } from "../commerce/smart-image";
import { WishlistButton } from "../commerce/wishlist-button";

const CYCLE_MS = 850;
const SIZES = "(max-width: 680px) 48vw, (max-width: 1100px) 31vw, 19vw";

export function ProductRailCard({
  product,
  rank,
}: {
  product: ProductListItem;
  rank: number;
}) {
  const images =
    product.gallery_image_urls && product.gallery_image_urls.length > 0
      ? product.gallery_image_urls
      : [product.primary_image_url];
  const [active, setActive] = useState(0);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  function startCycle() {
    if (images.length < 2 || timer.current) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    timer.current = setInterval(() => {
      setActive((i) => (i + 1) % images.length);
    }, CYCLE_MS);
  }

  function stopCycle() {
    if (timer.current) {
      clearInterval(timer.current);
      timer.current = null;
    }
    setActive(0);
  }

  const productHref = `/product/${product.slug}`;

  return (
    <article
      className="v3-gallery-card"
      onMouseEnter={startCycle}
      onMouseLeave={stopCycle}
    >
      <div className="v3-gallery-plate">
        <span className="v3-gallery-rank" aria-hidden="true">
          {String(rank).padStart(2, "0")}
        </span>
        <Link href={productHref} aria-label={product.name}>
          {images.map((src, i) => (
            <span
              key={`${src}-${i}`}
              className={`v3-gallery-shot${i === active ? " is-active" : ""}`}
              aria-hidden={i === active ? undefined : true}
            >
              <SmartImage
                src={src}
                alt={i === 0 ? product.primary_image_alt || product.name : ""}
                sizes={SIZES}
              />
            </span>
          ))}
        </Link>
        <WishlistButton slug={product.slug} />
        {images.length > 1 && (
          <div className="v3-gallery-dots" aria-hidden="true">
            {images.map((src, i) => (
              <span
                key={`${src}-dot-${i}`}
                className={`v3-gallery-dot${i === active ? " is-active" : ""}`}
              />
            ))}
          </div>
        )}
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
          />
          <Link href={productHref} className="v3-gallery-cta">
            Δες προϊόν
          </Link>
        </div>
      </div>
    </article>
  );
}
