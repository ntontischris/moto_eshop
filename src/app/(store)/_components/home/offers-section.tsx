import Link from "next/link";
import type { ProductListItem } from "@/lib/queries/products";
import { ProductCard } from "../commerce/product-card";

/* OffersSection — red-accented rail. Discount % shown by PriceDisplay only when
   compare_at_price is genuinely higher (no fabricated discounts, PRD §22). */

export function OffersSection({ products }: { products: ProductListItem[] }) {
  if (products.length === 0) return null;
  return (
    <section className="v3-off" aria-label="Προσφορές">
      <div className="v3-off-inner">
        <div className="v3-off-head">
          <div className="v3-off-htitle">
            <span className="v3-off-idx v3-display" aria-hidden="true">
              02
            </span>
            <h2>
              <span className="v3-off-tag v3-display">Προσφορές</span>
            </h2>
          </div>
          <Link href="/category/prosfores" className="v3-off-all">
            Όλες οι προσφορές <span aria-hidden="true">→</span>
          </Link>
        </div>
        <div className="v3-off-track">
          {products.map((p) => (
            <div key={p.id} className="v3-off-item">
              <ProductCard product={p} />
            </div>
          ))}
        </div>
      </div>
      <style precedence="default">{`
        .v3-off {
          padding: 48px var(--v3-gutter); background: var(--v3-graphite);
          border-top: 1px solid var(--v3-line);
          border-bottom: 1px solid var(--v3-line);
        }
        .v3-off-inner { max-width: 1320px; margin: 0 auto; }
        .v3-off-head {
          display: flex; align-items: flex-end;
          justify-content: space-between; margin-bottom: 28px; gap: 16px;
        }
        .v3-off-htitle { display: flex; align-items: center; gap: 18px; }
        .v3-off-idx {
          font-size: clamp(3rem, 8vw, 6.5rem); font-weight: 900;
          line-height: .8; color: transparent;
          -webkit-text-stroke: 1.5px rgba(228,17,31,.4);
          transform: skewX(-8deg); user-select: none;
        }
        .v3-off-head h2 { margin: 0; }
        .v3-off-tag {
          display: inline-block; background: var(--v3-red); color: #fff;
          font-size: clamp(1.6rem, 4vw, 3rem); font-weight: 900;
          text-transform: uppercase; letter-spacing: -.01em;
          padding: 6px 20px; transform: skewX(-6deg);
          clip-path: polygon(0 0,100% 0,100% 72%,
            calc(100% - 12px) 100%,0 100%);
        }
        .v3-off-all {
          color: var(--v3-bone-dim); text-decoration: none; font-weight: 700;
          font-size: .9rem; white-space: nowrap;
        }
        .v3-off-all:hover { color: var(--v3-bone); }
        .v3-off-track {
          display: grid; grid-auto-flow: column;
          grid-auto-columns: minmax(220px, 1fr);
          gap: 16px; overflow-x: auto; scroll-snap-type: x mandatory;
          padding-bottom: 8px;
        }
        .v3-off-item { scroll-snap-align: start; }
        @media (max-width: 520px) {
          .v3-off-track { grid-auto-columns: minmax(70%, 1fr); }
        }
      `}</style>
    </section>
  );
}
