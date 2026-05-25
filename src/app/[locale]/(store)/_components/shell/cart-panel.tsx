"use client";

import { Link } from "@/i18n/navigation";
import { useCallback, useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { formatPrice } from "../../_lib/format";
import { getCartRecommendations } from "../../_lib/cart-recommendations";
import { useV3 } from "./v3-provider";
import { cartLineKey } from "./v3-provider";

export function CartPanel() {
  const t = useTranslations("shell");
  const tc = useTranslations("common");
  const { cart, cartOpen, setCartOpen } = useV3();
  const panelRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const returnFocusRef = useRef<Element | null>(null);
  const recommendations = getCartRecommendations(cart);
  const subtotal = cart.reduce((sum, line) => sum + line.price * line.qty, 0);

  useEffect(() => {
    if (cartOpen) {
      returnFocusRef.current = document.activeElement;
      const id = setTimeout(() => closeRef.current?.focus(), 50);
      return () => clearTimeout(id);
    }

    if (returnFocusRef.current instanceof HTMLElement) {
      returnFocusRef.current.focus();
    }
    returnFocusRef.current = null;
  }, [cartOpen]);

  const handleKey = useCallback(
    (e: KeyboardEvent) => {
      if (!cartOpen) return;

      if (e.key === "Escape") {
        setCartOpen(false);
        return;
      }

      if (e.key === "Tab" && panelRef.current) {
        const focusable = Array.from(
          panelRef.current.querySelectorAll<HTMLElement>(
            "button:not([disabled]), a, [tabindex]:not([tabindex='-1'])",
          ),
        );
        if (!focusable.length) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    },
    [cartOpen, setCartOpen],
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [handleKey]);

  if (!cartOpen) return null;

  return (
    <div className="v3-cart-panel-shell" role="presentation">
      <button
        className="v3-cart-panel-backdrop"
        type="button"
        aria-label={t("cartClose")}
        onClick={() => setCartOpen(false)}
      />
      <aside
        ref={panelRef}
        className="v3-cart-panel"
        role="dialog"
        aria-label={t("cartDialog")}
        aria-modal="true"
      >
        <header className="v3-cart-panel-head">
          <div>
            <p className="v3-label">MotoMarket cart</p>
            <h2>{tc("cart")}</h2>
          </div>
          <button
            ref={closeRef}
            className="v3-cart-panel-close"
            type="button"
            onClick={() => setCartOpen(false)}
            aria-label={t("cartClose")}
          >
            ×
          </button>
        </header>

        {cart.length === 0 ? (
          <div className="v3-cart-panel-empty">
            <p>{t("cartEmpty")}</p>
            <Link
              className="v3-btn-primary"
              href="/category/eksoplismos-anabath"
              onClick={() => setCartOpen(false)}
            >
              {tc("continueShopping")} <span aria-hidden="true">→</span>
            </Link>
          </div>
        ) : (
          <>
            <div className="v3-cart-panel-body">
              <ul className="v3-cart-panel-lines">
                {cart.map((line) => (
                  <li className="v3-cart-panel-line" key={cartLineKey(line)}>
                    {line.image && (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img src={line.image} alt={line.name} />
                    )}
                    <div className="v3-cart-panel-info">
                      <span>{line.brand}</span>
                      <Link
                        href={`/product/${line.slug}`}
                        onClick={() => setCartOpen(false)}
                      >
                        {line.name}
                      </Link>
                      {line.size && (
                        <em>{t("cartSizeLabel", { size: line.size })}</em>
                      )}
                      <small>
                        {line.qty} × {formatPrice(line.price)}
                      </small>
                    </div>
                    <strong>{formatPrice(line.price * line.qty)}</strong>
                  </li>
                ))}
              </ul>

              <section
                className="v3-cart-panel-recs"
                aria-label={t("cartRecs")}
              >
                <p className="v3-label">Complete your ride</p>
                <h3>{t("cartFitsYour")}</h3>
                <div className="v3-cart-rec-list">
                  {recommendations.map((rec) => (
                    <Link
                      key={rec.title}
                      href={rec.href}
                      className="v3-cart-rec-card"
                      onClick={() => setCartOpen(false)}
                    >
                      <span>{rec.tag}</span>
                      <strong>{rec.title}</strong>
                      <em>{rec.reason}</em>
                    </Link>
                  ))}
                </div>
              </section>
            </div>

            <footer className="v3-cart-panel-foot">
              <div>
                <span>{tc("subtotal")}</span>
                <strong>{formatPrice(subtotal)}</strong>
              </div>
              <Link
                href="/cart"
                onClick={() => setCartOpen(false)}
                className="v3-btn-primary"
              >
                {tc("viewCart")}
              </Link>
            </footer>
          </>
        )}
      </aside>
    </div>
  );
}
