import "../(store)/_styles/tokens.css";
import "../(store)/_styles/components.css";
import "./wishlist.css";

import { Link, redirect } from "@/i18n/navigation";
import { getLocale } from "next-intl/server";
import Image from "next/image";
import { Suspense } from "react";
import { Heart } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getUserWishlist } from "@/lib/queries/wishlist";
import { PriceDisplay } from "@/components/ui/price-display";
import { WishlistButton } from "@/components/wishlist/wishlist-button";

export const metadata = { title: "Αγαπημένα | MotoMarket" };

export default function WishlistPage() {
  return (
    <div className="v3-root" data-v3>
      <main className="v3-wishlist v3-wishlist--apple">
        <Suspense fallback={<WishlistFallback />}>
          <WishlistContent />
        </Suspense>
      </main>
    </div>
  );
}

async function WishlistContent() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    const locale = await getLocale();
    return redirect({ href: "/login?next=/wishlist", locale });
  }

  const items = await getUserWishlist(user.id);

  if (items.length === 0) {
    return (
      <div className="v3-wishlist-empty">
        <Heart className="v3-wishlist-empty-icon" aria-hidden="true" />
        <p className="v3-label">Αγαπημένα</p>
        <h1 className="v3-display">Δεν έχεις αγαπημένα ακόμα</h1>
        <p className="v3-wishlist-empty-copy">
          Πρόσθεσε προϊόντα στα αγαπημένα σου πατώντας το εικονίδιο καρδιάς.
        </p>
        <Link className="v3-btn-primary" href="/">
          Ξεκίνα τις αγορές <span aria-hidden="true">→</span>
        </Link>
      </div>
    );
  }

  return (
    <>
      <header className="v3-wishlist-title">
        <p className="v3-label">Your garage</p>
        <h1 className="v3-display">Αγαπημένα ({items.length})</h1>
      </header>
      <div className="v3-wishlist-grid">
        {items.map((item) => (
          <article className="v3-wishlist-card" key={item.id}>
            <Link
              href={`/${item.product.category_slug}/${item.product.slug}`}
              className="v3-wishlist-media"
            >
              <Image
                src={item.product.primary_image_url}
                alt={item.product.primary_image_alt}
                fill
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                className="v3-wishlist-img"
              />
              {item.product.stock <= 0 && (
                <div className="v3-wishlist-oos">
                  <span>Εξαντλημένο</span>
                </div>
              )}
            </Link>
            <WishlistButton
              productId={item.product_id}
              initialWishlisted={true}
              isLoggedIn={true}
              className="v3-wishlist-toggle"
            />
            <div className="v3-wishlist-body">
              <span className="v3-wishlist-brand">{item.product.brand}</span>
              <Link
                href={`/${item.product.category_slug}/${item.product.slug}`}
                className="v3-wishlist-name"
              >
                {item.product.name}
              </Link>
              <div className="v3-wishlist-price">
                <PriceDisplay
                  price={item.product.price}
                  compareAtPrice={item.product.compare_at_price}
                  size="sm"
                />
              </div>
            </div>
          </article>
        ))}
      </div>
    </>
  );
}

function WishlistFallback() {
  return (
    <div className="v3-wishlist-skeleton" aria-hidden="true">
      <div className="v3-wishlist-skeleton-title" />
      <div className="v3-wishlist-grid">
        {Array.from({ length: 4 }).map((_, index) => (
          <div className="v3-wishlist-skeleton-card" key={index} />
        ))}
      </div>
    </div>
  );
}
