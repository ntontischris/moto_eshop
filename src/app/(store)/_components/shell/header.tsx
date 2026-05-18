"use client";

import Link from "next/link";
import { useV3 } from "./v3-provider";
import { CartPanel } from "./cart-panel";

export function Header() {
  const { cartCount, cartOpen, setCartOpen } = useV3();

  return (
    <>
      <header className="v3-header">
        <div className="v3-header-inner">
          <Link href="/" className="v3-wordmark" aria-label="MotoMarket αρχική">
            Moto<span>Market</span>
          </Link>

          <form
            role="search"
            className="v3-search-form"
            onSubmit={(e) => e.preventDefault()}
          >
            <input
              type="search"
              className="v3-search-input"
              aria-label="Αναζήτηση σε 11.000+ προϊόντα…"
              placeholder="Αναζήτηση σε 11.000+ προϊόντα…"
              autoComplete="off"
            />
          </form>

          <a href="#" className="v3-header-support">
            Υποστήριξη
          </a>

          <button
            className="v3-cart-btn"
            onClick={() => setCartOpen(!cartOpen)}
            aria-label={`Καλάθι, ${cartCount} προϊόντα`}
            aria-expanded={cartOpen}
          >
            🛒
            {cartCount > 0 && (
              <span className="v3-cart-badge" aria-hidden="true">
                {cartCount}
              </span>
            )}
            Καλάθι
          </button>
        </div>
      </header>

      <CartPanel />
    </>
  );
}
