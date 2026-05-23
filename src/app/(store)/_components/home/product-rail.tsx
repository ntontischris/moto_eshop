import Link from "next/link";
import type { ProductListItem } from "@/lib/queries/products";
import { AvailabilityBadge } from "../commerce/availability-badge";
import { PriceDisplay } from "../commerce/price-display";
import { SmartImage } from "../commerce/smart-image";
import { WishlistButton } from "../commerce/wishlist-button";

export interface ProductRailProps {
  title: string;
  products: ProductListItem[];
  href?: string;
}

export function ProductRail({ title, products, href }: ProductRailProps) {
  if (products.length === 0) return null;

  const galleryProducts = products.slice(0, 5);

  return (
    <section
      className="v3-rail v3-rail--reconstructed v3-rail--nour-gallery"
      aria-label={title}
    >
      <div className="v3-rail-inner">
        <div className="v3-rail-head">
          <div className="v3-rail-htitle">
            <div>
              <p className="v3-label">New arrivals</p>
              <h2 className="v3-display">{title}</h2>
            </div>
          </div>
          {href && (
            <Link href={href} className="v3-rail-all">
              Δες συλλογή <span aria-hidden="true">→</span>
            </Link>
          )}
        </div>

        <div className="v3-gallery-grid">
          {galleryProducts.map((p, index) => {
            const productHref = `/product/${p.slug}`;

            return (
              <article key={p.id} className="v3-gallery-card">
                <div className="v3-gallery-plate">
                  <span className="v3-gallery-rank" aria-hidden="true">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <Link href={productHref} aria-label={p.name}>
                    <SmartImage
                      src={p.primary_image_url}
                      alt={p.primary_image_alt || p.name}
                      sizes="(max-width: 680px) 48vw, (max-width: 1100px) 31vw, 19vw"
                    />
                  </Link>
                  <WishlistButton slug={p.slug} />
                </div>

                <div className="v3-gallery-info">
                  <div className="v3-gallery-topline">
                    <Link
                      href={`/search?q=${encodeURIComponent(p.brand)}`}
                      className="v3-card__brand"
                    >
                      {p.brand}
                    </Link>
                    <AvailabilityBadge stock={p.stock} />
                  </div>

                  <h3 className="v3-gallery-name">
                    <Link href={productHref}>{p.name}</Link>
                  </h3>

                  <div className="v3-gallery-footer">
                    <PriceDisplay
                      price={p.price}
                      compareAt={p.compare_at_price}
                    />
                    <Link href={productHref} className="v3-gallery-cta">
                      Δες προϊόν
                    </Link>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
