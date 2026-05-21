"use client";

import Link from "next/link";
import { getCartRecommendations } from "../_lib/cart-recommendations";
import { formatPrice } from "../_lib/format";
import { SmartImage } from "../_components/commerce/smart-image";
import { useV3, cartLineKey } from "../_components/shell/v3-provider";

const SHIPPING_FREE_OVER = 50;
const SHIPPING_COST = 3.5;

export default function CartPage() {
  const { cart, updateQty, removeFromCart, clearCart, cartTotal } = useV3();
  const recommendations = getCartRecommendations(cart);
  const shipping =
    cart.length === 0 || cartTotal >= SHIPPING_FREE_OVER ? 0 : SHIPPING_COST;
  const grand = cartTotal + shipping;

  return (
    <div className="v3-cart v3-cart--apple">
      <nav className="v3-cart-bc" aria-label="Breadcrumb">
        <Link href="/">Αρχική</Link>
        <span aria-hidden="true">/</span>
        <span>Καλάθι</span>
      </nav>

      <header className="v3-cart-title">
        <p className="v3-label">Your setup</p>
        <h1 className="v3-display">Καλάθι</h1>
      </header>

      {cart.length === 0 ? (
        <div className="v3-cart-empty">
          <p>Το καλάθι σου είναι άδειο.</p>
          <Link className="v3-btn-primary" href="/category/eksoplismos-anabath">
            Συνέχισε αγορές <span aria-hidden="true">→</span>
          </Link>
        </div>
      ) : (
        <div className="v3-cart-grid">
          <section className="v3-cart-lines" aria-label="Προϊόντα καλαθιού">
            {cart.map((line) => {
              const key = cartLineKey(line);
              return (
                <article className="v3-cart-row" key={key}>
                  <div className="v3-cart-img">
                    <SmartImage src={line.image} alt={line.name} sizes="96px" />
                  </div>
                  <div className="v3-cart-info">
                    <span className="v3-cart-brand">{line.brand}</span>
                    <Link href={`/product/${line.slug}`} className="v3-cart-name">
                      {line.name}
                    </Link>
                    {line.size && (
                      <span className="v3-cart-size">Μέγεθος: {line.size}</span>
                    )}
                    <button
                      type="button"
                      className="v3-cart-remove"
                      onClick={() => removeFromCart(key)}
                    >
                      Αφαίρεση
                    </button>
                  </div>
                  <div className="v3-cart-qty" aria-label="Ποσότητα">
                    <button
                      type="button"
                      aria-label="Μείωση"
                      onClick={() => updateQty(key, line.qty - 1)}
                    >
                      −
                    </button>
                    <span>{line.qty}</span>
                    <button
                      type="button"
                      aria-label="Αύξηση"
                      onClick={() => updateQty(key, line.qty + 1)}
                    >
                      +
                    </button>
                  </div>
                  <div className="v3-cart-price">
                    {formatPrice(line.price * line.qty)}
                  </div>
                </article>
              );
            })}
            <button type="button" className="v3-cart-clear" onClick={clearCart}>
              Άδειασμα καλαθιού
            </button>
          </section>

          <aside className="v3-cart-side" aria-label="Σύνοψη καλαθιού">
            <section className="v3-cart-sum">
              <h2>Σύνοψη</h2>
              <div className="v3-cart-sum-row">
                <span>Υποσύνολο</span>
                <span>{formatPrice(cartTotal)}</span>
              </div>
              <div className="v3-cart-sum-row">
                <span>Αποστολή</span>
                <span>{shipping === 0 ? "Δωρεάν" : formatPrice(shipping)}</span>
              </div>
              {shipping > 0 && (
                <p className="v3-cart-ship-note">
                  Δωρεάν αποστολή για παραγγελίες άνω των{" "}
                  {formatPrice(SHIPPING_FREE_OVER)}.
                </p>
              )}
              <div className="v3-cart-sum-row v3-cart-sum-total">
                <span>Σύνολο</span>
                <span>{formatPrice(grand)}</span>
              </div>
              <Link className="v3-btn-primary v3-cart-checkout" href="/checkout">
                Ολοκλήρωση παραγγελίας <span aria-hidden="true">→</span>
              </Link>
              <Link href="/category/eksoplismos-anabath" className="v3-cart-cont">
                Συνέχισε αγορές
              </Link>
            </section>

            <section className="v3-cart-page-recs" aria-label="Προτάσεις">
              <p className="v3-label">Complete your ride</p>
              <h2>Πρόσθεσε ό,τι ταιριάζει.</h2>
              {recommendations.map((rec) => (
                <Link key={rec.title} href={rec.href} className="v3-cart-page-rec">
                  <span>{rec.tag}</span>
                  <strong>{rec.title}</strong>
                  <em>{rec.reason}</em>
                </Link>
              ))}
            </section>
          </aside>
        </div>
      )}
    </div>
  );
}
