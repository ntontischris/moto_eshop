"use client";

import Link from "next/link";
import { useV3, cartLineKey } from "../_components/shell/v3-provider";
import { SmartImage } from "../_components/commerce/smart-image";
import { formatPrice } from "../_lib/format";

const SHIPPING_FREE_OVER = 50;
const SHIPPING_COST = 3.5;

export default function CartPage() {
  const { cart, updateQty, removeFromCart, clearCart, cartTotal } = useV3();

  const shipping =
    cart.length === 0 || cartTotal >= SHIPPING_FREE_OVER ? 0 : SHIPPING_COST;
  const grand = cartTotal + shipping;

  return (
    <div className="v3-cart">
      <nav className="v3-cart-bc" aria-label="Breadcrumb">
        <Link href="/">Αρχική</Link>
        <span aria-hidden="true">/</span>
        <span>Καλάθι</span>
      </nav>

      <h1 className="v3-display">
        Καλάθι<span className="v3-cart-dot">.</span>
      </h1>

      {cart.length === 0 ? (
        <div className="v3-cart-empty">
          <p>Το καλάθι σου είναι άδειο.</p>
          <Link className="v3-btn-primary" href="/category/eksoplismos-anabath">
            Συνέχισε τα ψώνια <span aria-hidden="true">→</span>
          </Link>
        </div>
      ) : (
        <div className="v3-cart-grid">
          <div className="v3-cart-lines">
            {cart.map((l) => {
              const key = cartLineKey(l);
              return (
                <div className="v3-cart-row" key={key}>
                  <div className="v3-cart-img">
                    <SmartImage src={l.image} alt={l.name} sizes="96px" />
                  </div>
                  <div className="v3-cart-info">
                    <span className="v3-cart-brand">{l.brand}</span>
                    <Link href={`/product/${l.slug}`} className="v3-cart-name">
                      {l.name}
                    </Link>
                    {l.size && (
                      <span className="v3-cart-size">Μέγεθος: {l.size}</span>
                    )}
                    <button
                      type="button"
                      className="v3-cart-remove"
                      onClick={() => removeFromCart(key)}
                    >
                      Αφαίρεση
                    </button>
                  </div>
                  <div className="v3-cart-qty">
                    <button
                      type="button"
                      aria-label="Μείωση"
                      onClick={() => updateQty(key, l.qty - 1)}
                    >
                      −
                    </button>
                    <span>{l.qty}</span>
                    <button
                      type="button"
                      aria-label="Αύξηση"
                      onClick={() => updateQty(key, l.qty + 1)}
                    >
                      +
                    </button>
                  </div>
                  <div className="v3-cart-price">
                    {formatPrice(l.price * l.qty)}
                  </div>
                </div>
              );
            })}
            <button type="button" className="v3-cart-clear" onClick={clearCart}>
              Άδειασμα καλαθιού
            </button>
          </div>

          <aside className="v3-cart-sum" aria-label="Σύνοψη">
            <h2 className="v3-display">Σύνοψη</h2>
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
              ← Συνέχεια αγορών
            </Link>
          </aside>
        </div>
      )}

      <style precedence="default">{`
        .v3-cart { max-width: 1180px; margin: 0 auto;
          padding: 28px var(--v3-gutter) 90px; }
        .v3-cart-bc { display: flex; gap: 8px; font-size: .82rem;
          color: var(--v3-bone-dim); margin-bottom: 18px; }
        .v3-cart-bc a { color: var(--v3-bone-dim); text-decoration: none; }
        .v3-cart-bc a:hover { color: var(--v3-bone); }
        .v3-cart h1 { margin: 0 0 28px; font-size: clamp(2rem,5vw,3.4rem);
          font-weight: 900; text-transform: uppercase; transform: skewX(-6deg);
          color: var(--v3-bone); }
        .v3-cart-dot { color: var(--v3-red); }
        .v3-cart-empty { display: flex; flex-direction: column;
          align-items: flex-start; gap: 20px; color: var(--v3-bone-dim);
          padding: 40px 0; }
        .v3-cart-empty .v3-btn-primary { text-decoration: none; }
        .v3-cart-grid { display: grid;
          grid-template-columns: 1fr 340px; gap: 40px; align-items: start; }
        .v3-cart-row { display: grid;
          grid-template-columns: 96px 1fr auto auto; gap: 18px;
          align-items: center; padding: 18px 0;
          border-bottom: 1px solid var(--v3-line); }
        .v3-cart-img { position: relative; width: 96px; aspect-ratio: 4/5;
          background: var(--v3-graphite); overflow: hidden;
          border: 1px solid var(--v3-line); }
        .v3-cart-info { display: flex; flex-direction: column; gap: 4px; }
        .v3-cart-brand { font-family: var(--v3-display); font-weight: 800;
          font-size: .72rem; letter-spacing: .14em; text-transform: uppercase;
          color: var(--v3-red); }
        .v3-cart-name { color: var(--v3-bone); text-decoration: none;
          font-weight: 600; font-size: .95rem; }
        .v3-cart-name:hover { color: var(--v3-cyan); }
        .v3-cart-size { font-size: .8rem; color: var(--v3-bone-dim); }
        .v3-cart-remove { align-self: flex-start; background: none;
          border: none; color: var(--v3-bone-dim); font-size: .78rem;
          cursor: pointer; padding: 2px 0; text-decoration: underline; }
        .v3-cart-remove:hover { color: var(--v3-red); }
        .v3-cart-qty { display: flex; align-items: center; gap: 10px;
          border: 1px solid var(--v3-line); border-radius: 6px;
          padding: 6px 10px; }
        .v3-cart-qty button { background: none; border: none;
          color: var(--v3-bone); font-size: 1.1rem; cursor: pointer;
          width: 22px; }
        .v3-cart-qty button:hover { color: var(--v3-red); }
        .v3-cart-price { font-weight: 800; color: var(--v3-bone);
          min-width: 90px; text-align: right; }
        .v3-cart-clear { margin-top: 18px; background: none; border: none;
          color: var(--v3-bone-dim); font-size: .82rem; cursor: pointer;
          text-decoration: underline; }
        .v3-cart-clear:hover { color: var(--v3-red); }
        .v3-cart-sum { background: var(--v3-surface);
          border: 1px solid var(--v3-line); padding: 24px;
          position: sticky; top: 96px;
          clip-path: polygon(0 0,100% 0,100% calc(100% - 16px),
            calc(100% - 16px) 100%,0 100%); }
        .v3-cart-sum h2 { margin: 0 0 18px; font-size: 1.3rem;
          font-weight: 900; text-transform: uppercase;
          color: var(--v3-bone); }
        .v3-cart-sum-row { display: flex; justify-content: space-between;
          padding: 9px 0; color: var(--v3-bone-dim); font-size: .92rem; }
        .v3-cart-ship-note { margin: 4px 0 0; font-size: .76rem;
          color: var(--v3-bone-dim); }
        .v3-cart-sum-total { border-top: 1px solid var(--v3-line);
          margin-top: 8px; padding-top: 14px; color: var(--v3-bone);
          font-weight: 900; font-size: 1.15rem; }
        .v3-cart-checkout { display: flex; justify-content: center;
          width: 100%; margin: 18px 0 12px; text-decoration: none; }
        .v3-cart-cont { display: block; text-align: center;
          color: var(--v3-bone-dim); text-decoration: none;
          font-size: .85rem; }
        .v3-cart-cont:hover { color: var(--v3-bone); }
        @media (max-width: 900px) {
          .v3-cart-grid { grid-template-columns: 1fr; gap: 28px; }
          .v3-cart-sum { position: static; }
        }
        @media (max-width: 560px) {
          .v3-cart-row { grid-template-columns: 72px 1fr;
            grid-template-areas: "img info" "qty price"; row-gap: 12px; }
          .v3-cart-img { width: 72px; grid-area: img; }
          .v3-cart-info { grid-area: info; }
          .v3-cart-qty { grid-area: qty; justify-self: start; }
          .v3-cart-price { grid-area: price; }
        }
      `}</style>
    </div>
  );
}
