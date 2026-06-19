"use client";

import "./cart.css";

import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { getCartRecommendations } from "../_lib/cart-recommendations";
import { formatPrice } from "../_lib/format";
import { SmartImage } from "../_components/commerce/smart-image";
import { CartLineSize } from "../_components/commerce/cart-line-size";
import { useV3, cartLineKey } from "../_components/shell/v3-provider";
import {
  FREE_SHIPPING_THRESHOLD,
  DEFAULT_SHIPPING_ESTIMATE,
} from "@/lib/cart/utils";

export default function CartPage() {
  const t = useTranslations("cart");
  const { cart, updateQty, removeFromCart, clearCart, cartTotal } = useV3();
  const recommendations = getCartRecommendations(cart);
  const shipping =
    cart.length === 0 || cartTotal >= FREE_SHIPPING_THRESHOLD
      ? 0
      : DEFAULT_SHIPPING_ESTIMATE;
  const grand = cartTotal + shipping;

  return (
    <div className="v3-cart v3-cart--apple">
      <nav className="v3-cart-bc" aria-label="Breadcrumb">
        <Link href="/">{t("homeLabel")}</Link>
        <span aria-hidden="true">/</span>
        <span>{t("cartLabel")}</span>
      </nav>

      <header className="v3-cart-title">
        <p className="v3-label">Your setup</p>
        <h1 className="v3-display">{t("heading")}</h1>
      </header>

      {cart.length === 0 ? (
        <div className="v3-cart-empty">
          <p>{t("empty")}</p>
          <Link className="v3-btn-primary" href="/category/eksoplismos-anabath">
            {t("continueShopping")} <span aria-hidden="true">→</span>
          </Link>
        </div>
      ) : (
        <div className="v3-cart-grid">
          <section className="v3-cart-lines" aria-label={t("linesLabel")}>
            {cart.map((line) => {
              const key = cartLineKey(line);
              return (
                <article className="v3-cart-row" key={key}>
                  <div className="v3-cart-img">
                    <SmartImage src={line.image} alt={line.name} sizes="96px" />
                  </div>
                  <div className="v3-cart-info">
                    <span className="v3-cart-brand">{line.brand}</span>
                    <Link
                      href={`/product/${line.slug}`}
                      className="v3-cart-name"
                    >
                      {line.name}
                    </Link>
                    {line.size && (
                      <CartLineSize
                        slug={line.slug}
                        lineId={line.id}
                        currentSize={line.size}
                      />
                    )}
                    <button
                      type="button"
                      className="v3-cart-remove"
                      onClick={() => removeFromCart(line.id)}
                    >
                      {t("remove")}
                    </button>
                  </div>
                  <div className="v3-cart-qty" aria-label={t("qtyLabel")}>
                    <button
                      type="button"
                      aria-label={t("decrease")}
                      onClick={() => updateQty(line.id, line.qty - 1)}
                    >
                      −
                    </button>
                    <span>{line.qty}</span>
                    <button
                      type="button"
                      aria-label={t("increase")}
                      onClick={() => updateQty(line.id, line.qty + 1)}
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
              {t("clearCart")}
            </button>
          </section>

          <aside className="v3-cart-side" aria-label={t("summaryLabel")}>
            <section className="v3-cart-sum">
              <h2>{t("summaryHeading")}</h2>
              <div className="v3-cart-sum-row">
                <span>{t("subtotal")}</span>
                <span>{formatPrice(cartTotal)}</span>
              </div>
              <div className="v3-cart-sum-row">
                <span>{t("shipping")}</span>
                <span>
                  {shipping === 0 ? t("free") : formatPrice(shipping)}
                </span>
              </div>
              {shipping > 0 && (
                <p className="v3-cart-ship-note">
                  {t("freeShippingNote", {
                    amount: formatPrice(FREE_SHIPPING_THRESHOLD),
                  })}
                </p>
              )}
              <div className="v3-cart-sum-row v3-cart-sum-total">
                <span>{t("total")}</span>
                <span>{formatPrice(grand)}</span>
              </div>
              <Link
                className="v3-btn-primary v3-cart-checkout"
                href="/checkout"
              >
                {t("checkout")} <span aria-hidden="true">→</span>
              </Link>
              <Link
                href="/category/eksoplismos-anabath"
                className="v3-cart-cont"
              >
                {t("continueShopping")}
              </Link>
            </section>

            <section className="v3-cart-page-recs" aria-label={t("recsLabel")}>
              <p className="v3-label">Complete your ride</p>
              <h2>{t("recsHeading")}</h2>
              {recommendations.map((rec) => (
                <Link
                  key={rec.title}
                  href={rec.href}
                  className="v3-cart-page-rec"
                >
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
