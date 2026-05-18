"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useV3 } from "./v3-provider";
import { CartPanel } from "./cart-panel";

export function Header() {
  const { cartCount, cartOpen, setCartOpen } = useV3();
  const router = useRouter();

  function onSearch(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const q = String(new FormData(e.currentTarget).get("q") ?? "").trim();
    if (q.length >= 2) router.push(`/search?q=${encodeURIComponent(q)}`);
  }

  return (
    <>
      <header className="v3-header">
        <div className="v3-header-inner">
          <Link href="/" className="v3-wordmark" aria-label="MotoMarket αρχική">
            Moto<span>Market</span>
          </Link>

          <form role="search" className="v3-search-form" onSubmit={onSearch}>
            <input
              type="search"
              name="q"
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
