"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { ProductListItem } from "@/lib/queries/products";
import { AvailabilityBadge } from "../commerce/availability-badge";
import { PriceDisplay } from "../commerce/price-display";
import { SmartImage } from "../commerce/smart-image";
import { WishlistButton } from "../commerce/wishlist-button";

const CYCLE_MS = 1700;
const TILT_MAX = 7;
const SIZES = "(max-width: 680px) 48vw, (max-width: 1100px) 31vw, 19vw";

function prefersReducedMotion() {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

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
  const cardRef = useRef<HTMLElement>(null);
  const frame = useRef<number | null>(null);

  // Auto-advance through every image on its own; stagger the start by rank
  // so the cards in a row don't all flip in unison.
  useEffect(() => {
    if (images.length < 2 || prefersReducedMotion()) return;
    let interval: ReturnType<typeof setInterval> | undefined;
    const start = setTimeout(() => {
      interval = setInterval(
        () => setActive((i) => (i + 1) % images.length),
        CYCLE_MS,
      );
    }, rank * 320);
    return () => {
      clearTimeout(start);
      if (interval) clearInterval(interval);
    };
  }, [images.length, rank]);

  // Subtle 3D tilt toward the cursor for depth. Ref + rAF so it never
  // triggers React re-renders, and disabled under reduced-motion.
  function handleMove(e: React.MouseEvent<HTMLElement>) {
    const el = cardRef.current;
    if (!el || prefersReducedMotion()) return;
    const rect = el.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width;
    const py = (e.clientY - rect.top) / rect.height;
    const rx = (0.5 - py) * TILT_MAX * 2;
    const ry = (px - 0.5) * TILT_MAX * 2;
    if (frame.current) cancelAnimationFrame(frame.current);
    frame.current = requestAnimationFrame(() => {
      el.style.transform = `perspective(900px) rotateX(${rx.toFixed(2)}deg) rotateY(${ry.toFixed(2)}deg) translateZ(14px)`;
    });
  }

  function handleEnter() {
    const el = cardRef.current;
    if (el) el.style.transition = "transform 0.1s ease-out";
  }

  function handleLeave() {
    const el = cardRef.current;
    if (!el) return;
    if (frame.current) cancelAnimationFrame(frame.current);
    el.style.transition = "transform 0.5s ease";
    el.style.transform = "perspective(900px) rotateX(0deg) rotateY(0deg)";
  }

  const productHref = `/product/${product.slug}`;

  return (
    <article
      ref={cardRef}
      className="v3-gallery-card"
      onMouseEnter={handleEnter}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
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
