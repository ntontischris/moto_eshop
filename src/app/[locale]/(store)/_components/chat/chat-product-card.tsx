"use client";

import Link from "next/link";
import { useLocale } from "next-intl";
import type { ChatProductSummary } from "@/lib/chat/tools/show-product-cards";
import styles from "./chat.module.css";

interface Props {
  product: ChatProductSummary;
  onAddToCart?: (productId: string) => void;
}

export function ChatProductCard({ product, onAddToCart }: Props) {
  const locale = useLocale();
  const formatted = new Intl.NumberFormat(locale, {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(product.price);

  return (
    <article className={styles.card}>
      <Link
        href={`/${locale}/product/${product.slug}`}
        className={styles.cardImageLink}
        prefetch={false}
      >
        {product.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={product.image}
            alt={product.name}
            loading="lazy"
            className={styles.cardImage}
          />
        ) : (
          <div className={styles.cardImagePlaceholder} aria-hidden="true" />
        )}
      </Link>
      <div className={styles.cardBody}>
        {product.brand && (
          <span className={styles.cardBrand}>{product.brand}</span>
        )}
        <Link
          href={`/${locale}/product/${product.slug}`}
          className={styles.cardName}
          prefetch={false}
        >
          {product.name}
        </Link>
        <div className={styles.cardFooter}>
          <span className={styles.cardPrice}>{formatted}</span>
          {!product.in_stock && (
            <span className={styles.cardOos}>Εξαντλημένο</span>
          )}
          {product.in_stock && onAddToCart && (
            <button
              type="button"
              className={styles.cardCta}
              onClick={() => onAddToCart(product.id)}
              aria-label={`Πρόσθεσε ${product.name} στο καλάθι`}
            >
              +
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
