"use client";

import { useMemo, useState } from "react";
import type { Product } from "@/lib/queries/products";
import { useV3 } from "../shell/v3-provider";
import { PriceDisplay } from "../commerce/price-display";
import { Badge } from "../commerce/badge";
import { AvailabilityBadge } from "../commerce/availability-badge";
import { SizeSelector } from "./size-selector";

/* BuyBox — above-the-fold purchase decision area. Sizes are display-only
   (variant sizes not modelled on Product) — clearly noted, no fake stock. */

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
  const { addToCart, setCartOpen } = useV3();
  const { sizes, fromSpecs } = useMemo(
    () => deriveSizes(product.specs ?? {}),
    [product.specs],
  );
  const [size, setSize] = useState<string | null>(null);

  const inStock = product.stock > 0;
  const image = product.images[0]?.url ?? "";

  const badges: { label: string; tone: "tech" | "neutral" }[] = [];
  if (product.certification)
    badges.push({ label: product.certification, tone: "tech" });
  if (product.rider_type)
    badges.push({ label: product.rider_type, tone: "neutral" });

  const onAdd = () => {
    if (!inStock) return;
    addToCart({
      slug: product.slug,
      name: product.name,
      brand: product.brand,
      price: product.price,
      size,
      image,
      qty: 1,
    });
    setCartOpen(true);
  };

  return (
    <div className="v3-bb">
      <p className="v3-bb-brand">{product.brand}</p>
      <h1>{product.name}</h1>
      <div className="v3-bb-meta">
        {product.sku && <span>Κωδικός: {product.sku}</span>}
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
          {badges.map((b) => (
            <Badge key={b.label} label={b.label} tone={b.tone} />
          ))}
        </div>
      )}

      <div className="v3-bb-size">
        <div className="v3-bb-size-head">
          <span>Μέγεθος</span>
          <a href="#size-guide">Οδηγός μεγεθών</a>
        </div>
        <SizeSelector sizes={sizes} value={size} onChange={setSize} />
        {!fromSpecs && (
          <p className="v3-bb-note">
            Τα διαθέσιμα μεγέθη ανά κωδικό επιβεβαιώνονται κατά την παραγγελία.
          </p>
        )}
      </div>

      <div className="v3-bb-avail">
        <AvailabilityBadge stock={product.stock} />
      </div>

      <button
        type="button"
        className="v3-btn-primary v3-bb-cta"
        disabled={!inStock}
        onClick={onAdd}
      >
        {inStock ? "Προσθήκη στο καλάθι" : "Εξαντλημένο"}
      </button>

      <ul className="v3-bb-trust">
        <li>Παράδοση 1–3 εργάσιμες</li>
        <li>Αλλαγή μεγέθους εντός 14 ημερών</li>
        <li>Ασφαλείς πληρωμές · επίσημος προμηθευτής</li>
      </ul>

      <style precedence="default">{`
        .v3-bb { display: flex; flex-direction: column; gap: 16px; }
        .v3-bb-brand {
          margin: 0; font-family: var(--v3-display);
          text-transform: uppercase; letter-spacing: .18em;
          font-size: .82rem; font-weight: 800; color: var(--v3-red);
        }
        .v3-bb h1 {
          margin: 0; font-family: var(--v3-display);
          font-size: clamp(1.9rem, 4.2vw, 3rem);
          font-weight: 900; color: var(--v3-bone); line-height: 1.02;
          text-transform: uppercase; transform: skewX(-5deg);
        }
        .v3-bb-meta {
          display: flex; gap: 16px; font-size: .82rem;
          color: var(--v3-bone-dim);
        }
        .v3-bb-price { font-size: 1.15rem; }
        .v3-bb-badges { display: flex; flex-wrap: wrap; gap: 8px; }
        .v3-bb-size-head {
          display: flex; justify-content: space-between; align-items: baseline;
          margin-bottom: 10px; font-size: .9rem; color: var(--v3-bone);
          font-weight: 700;
        }
        .v3-bb-size-head a { font-size: .8rem; color: var(--v3-cyan);
          text-decoration: none; font-weight: 600; }
        .v3-bb-note { margin: 8px 0 0; font-size: .76rem;
          color: var(--v3-bone-dim); }
        .v3-bb-cta { width: 100%; font-size: 1rem; }
        .v3-bb-cta:disabled { opacity: .5; cursor: not-allowed; }
        .v3-bb-trust {
          list-style: none; margin: 4px 0 0; padding: 16px 0 0;
          border-top: 1px solid var(--v3-line);
          display: flex; flex-direction: column; gap: 8px;
          font-size: .82rem; color: var(--v3-bone-dim);
        }
        .v3-bb-trust li::before { content: "✓"; color: var(--v3-green);
          margin-right: 8px; font-weight: 700; }
      `}</style>
    </div>
  );
}
