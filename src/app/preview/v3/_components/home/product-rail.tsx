import Link from "next/link";
import type { ProductListItem } from "@/lib/queries/products";
import { ProductCard } from "../commerce/product-card";

/* ProductRail — horizontal scroll-snap row of cards. CSS scroll only. */

export interface ProductRailProps {
  title: string;
  products: ProductListItem[];
  href?: string;
  index?: string;
}

export function ProductRail({
  title,
  products,
  href,
  index = "01",
}: ProductRailProps) {
  if (products.length === 0) return null;
  return (
    <section className="v3-rail" aria-label={title}>
      <div className="v3-rail-inner">
        <div className="v3-rail-head">
          <div className="v3-rail-htitle">
            <span className="v3-rail-idx v3-display" aria-hidden="true">
              {index}
            </span>
            <h2 className="v3-display">{title}</h2>
          </div>
          {href && (
            <Link href={href} className="v3-rail-all">
              Δείτε όλα <span aria-hidden="true">→</span>
            </Link>
          )}
        </div>
        <div className="v3-rail-track">
          {products.map((p) => (
            <div key={p.id} className="v3-rail-item">
              <ProductCard product={p} />
            </div>
          ))}
        </div>
      </div>
      <style precedence="default">{`
        .v3-rail { padding: clamp(56px,8vw,96px) var(--v3-gutter); }
        .v3-rail-inner { max-width: 1320px; margin: 0 auto; }
        .v3-rail-head {
          display: flex; align-items: flex-end;
          justify-content: space-between; margin-bottom: 28px; gap: 16px;
        }
        .v3-rail-htitle { display: flex; align-items: center; gap: 18px; }
        .v3-rail-idx {
          font-size: clamp(3rem, 8vw, 6.5rem); font-weight: 900;
          line-height: .8; color: transparent;
          -webkit-text-stroke: 1.5px rgba(245,243,238,.2);
          transform: skewX(-8deg); user-select: none;
        }
        .v3-rail-head h2 {
          margin: 0; font-size: clamp(1.8rem, 4.4vw, 3.2rem);
          font-weight: 900; color: var(--v3-bone); transform: skewX(-6deg);
          text-transform: uppercase;
        }
        .v3-rail-all {
          color: var(--v3-bone-dim); text-decoration: none; font-weight: 700;
          font-size: .9rem; white-space: nowrap;
        }
        .v3-rail-all:hover { color: var(--v3-bone); }
        .v3-rail-track {
          display: grid; grid-auto-flow: column;
          grid-auto-columns: minmax(220px, 1fr);
          gap: 16px; overflow-x: auto; scroll-snap-type: x mandatory;
          padding-bottom: 8px;
        }
        .v3-rail-item { scroll-snap-align: start; }
        @media (max-width: 520px) {
          .v3-rail-track { grid-auto-columns: minmax(70%, 1fr); }
        }
      `}</style>
    </section>
  );
}
