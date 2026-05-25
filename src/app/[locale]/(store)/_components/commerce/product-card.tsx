"use client";

import { useEffect, useRef, useState } from "react";
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

const CYCLE_MS = 1300;
const TILT_MAX = 7;

function prefersReducedMotion() {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

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
  const href = `/product/${product.slug}`;
  const images =
    product.gallery_image_urls && product.gallery_image_urls.length > 0
      ? product.gallery_image_urls
      : [product.primary_image_url];

  const [active, setActive] = useState(0);
  // Only the first image loads up front; the rest mount on first hover so a
  // grid never downloads every gallery shot for products you don't inspect.
  const [armed, setArmed] = useState(false);
  const cardRef = useRef<HTMLElement>(null);
  const frame = useRef<number | null>(null);
  const cycle = useRef<ReturnType<typeof setInterval> | null>(null);

  // Cycle through the product's images ONLY while the card is hovered, so a
  // dense grid never feels busy — every other card stays on its first photo.
  function startCycle() {
    if (images.length < 2 || prefersReducedMotion() || cycle.current) return;
    cycle.current = setInterval(
      () => setActive((i) => (i + 1) % images.length),
      CYCLE_MS,
    );
  }
  function stopCycle() {
    if (cycle.current) {
      clearInterval(cycle.current);
      cycle.current = null;
    }
    setActive(0);
  }

  useEffect(
    () => () => {
      if (cycle.current) clearInterval(cycle.current);
    },
    [],
  );

  // Subtle 3D tilt toward the cursor. Ref + rAF only — never re-renders React.
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
      el.style.transform = `perspective(900px) rotateX(${rx.toFixed(2)}deg) rotateY(${ry.toFixed(2)}deg) translateZ(12px)`;
    });
  }

  function handleEnter() {
    setArmed(true);
    startCycle();
    const el = cardRef.current;
    if (!el || prefersReducedMotion()) return;
    el.style.willChange = "transform";
    el.style.transition = "transform 0.1s ease-out";
  }

  function handleLeave() {
    stopCycle();
    const el = cardRef.current;
    if (!el) return;
    if (frame.current) cancelAnimationFrame(frame.current);
    el.style.transition = "transform 0.5s ease";
    el.style.transform = "perspective(900px) rotateX(0deg) rotateY(0deg)";
    el.style.willChange = "auto";
  }

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
      className={`v3-product-card${compact ? " is-compact" : ""}`}
      onMouseEnter={handleEnter}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
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
          {(armed ? images : images.slice(0, 1)).map((src, i) => (
            <span
              key={`${src}-${i}`}
              className={`v3-product-shot${i === active ? " is-active" : ""}`}
              aria-hidden={i === active ? undefined : true}
            >
              <SmartImage
                src={src}
                alt={i === 0 ? product.primary_image_alt || product.name : ""}
                sizes={sizes}
              />
            </span>
          ))}
          {images.length > 1 && (
            <span className="v3-gallery-dots" aria-hidden="true">
              {images.map((src, i) => (
                <span
                  key={`${src}-dot-${i}`}
                  className={`v3-gallery-dot${i === active ? " is-active" : ""}`}
                />
              ))}
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
