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
const SIZES = "(max-width: 680px) 72vw, (max-width: 1180px) 34vw, 272px";

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

  // Auto-advance through every image, but only while the card is on screen —
  // keeps a long horizontal rail cheap when most cards are scrolled away.
  useEffect(() => {
    if (images.length < 2 || prefersReducedMotion()) return;
    const el = cardRef.current;
    if (!el) return;

    let interval: ReturnType<typeof setInterval> | undefined;
    const start = () => {
      if (interval) return;
      interval = setInterval(
        () => setActive((i) => (i + 1) % images.length),
        CYCLE_MS,
      );
    };
    const stop = () => {
      if (interval) {
        clearInterval(interval);
        interval = undefined;
      }
    };

    const io = new IntersectionObserver(
      ([entry]) => (entry?.isIntersecting ? start() : stop()),
      { threshold: 0.25 },
    );
    io.observe(el);

    return () => {
      io.disconnect();
      stop();
    };
  }, [images.length]);

  // Subtle 3D tilt toward the cursor. Skipped while a button is held (the
  // rail is being dragged) and under reduced-motion. Ref + rAF only, so it
  // never triggers a React re-render.
  function handleMove(e: React.MouseEvent<HTMLElement>) {
    const el = cardRef.current;
    if (!el || e.buttons !== 0 || prefersReducedMotion()) return;
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
    if (!el || prefersReducedMotion()) return;
    el.style.willChange = "transform";
    el.style.transition = "transform 0.1s ease-out";
  }

  function handleLeave() {
    const el = cardRef.current;
    if (!el) return;
    if (frame.current) cancelAnimationFrame(frame.current);
    el.style.transition = "transform 0.5s ease";
    el.style.transform = "perspective(900px) rotateX(0deg) rotateY(0deg)";
    el.style.willChange = "auto";
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
