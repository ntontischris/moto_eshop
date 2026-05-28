"use client";

import type { ChatProductSummary } from "@/lib/chat/tools/show-product-cards";
import { ChatProductCard } from "./chat-product-card";
import styles from "./chat.module.css";

interface Props {
  products: ChatProductSummary[];
  notFound?: string[];
  onAddToCart?: (productId: string) => void;
}

export function ChatProductCarousel({
  products,
  notFound,
  onAddToCart,
}: Props) {
  if (products.length === 0) {
    return (
      <div className={`${styles.bubble} ${styles.bubbleAssistant}`}>
        Δεν βρήκα προϊόντα να σου δείξω.
      </div>
    );
  }

  return (
    <div className={styles.carouselWrap}>
      <div
        className={styles.carousel}
        role="region"
        aria-label="Πιο σχετικά προϊόντα"
      >
        {products.map((p) => (
          <ChatProductCard key={p.id} product={p} onAddToCart={onAddToCart} />
        ))}
      </div>
      {notFound && notFound.length > 0 && (
        <p className={styles.carouselNotFound}>
          Δεν βρήκα: {notFound.join(", ")}.
        </p>
      )}
    </div>
  );
}
