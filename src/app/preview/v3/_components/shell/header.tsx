"use client";

import Link from "next/link";
import { useV3 } from "./v3-provider";
import { CartPanel } from "./cart-panel";

export function Header() {
  const { cartCount, cartOpen, setCartOpen } = useV3();

  return (
    <>
      <style>{`
        .v3-header {
          position: sticky;
          top: 0;
          z-index: 200;
          background: var(--v3-carbon);
          border-bottom: 1px solid var(--v3-line);
        }
        .v3-header-inner {
          display: grid;
          grid-template-columns: auto 1fr auto auto;
          align-items: center;
          gap: 16px;
          padding: 12px var(--v3-gutter);
          max-width: 1440px;
          margin: 0 auto;
        }
        .v3-wordmark {
          font-size: 22px;
          font-weight: 900;
          letter-spacing: -0.03em;
          color: var(--v3-bone);
          text-decoration: none;
          white-space: nowrap;
          flex-shrink: 0;
        }
        .v3-wordmark span { color: var(--v3-red); }
        .v3-wordmark:focus-visible {
          outline: 2px solid var(--v3-cyan);
          outline-offset: 3px;
          border-radius: 4px;
        }
        .v3-search-form {
          display: flex;
          width: 100%;
        }
        .v3-search-input {
          flex: 1;
          min-height: 52px;
          background: var(--v3-surface);
          border: 1px solid var(--v3-line);
          border-radius: var(--v3-radius);
          color: var(--v3-bone);
          font-size: 15px;
          padding: 0 18px;
          outline: none;
          transition: border-color .15s;
          font-family: var(--v3-font);
        }
        .v3-search-input::placeholder { color: var(--v3-bone-dim); }
        .v3-search-input:focus { border-color: var(--v3-cyan); }
        .v3-header-support {
          color: var(--v3-bone-dim);
          text-decoration: none;
          font-size: 13px;
          white-space: nowrap;
          transition: color .15s;
        }
        .v3-header-support:hover { color: var(--v3-bone); }
        .v3-header-support:focus-visible {
          outline: 2px solid var(--v3-cyan);
          outline-offset: 2px;
          border-radius: 2px;
        }
        .v3-cart-btn {
          position: relative;
          background: var(--v3-red);
          border: none;
          border-radius: var(--v3-radius);
          color: #fff;
          cursor: pointer;
          font-size: 13px;
          font-weight: 700;
          padding: 10px 18px;
          white-space: nowrap;
          transition: background .15s;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .v3-cart-btn:hover { background: var(--v3-red-hover); }
        .v3-cart-btn:focus-visible {
          outline: 2px solid var(--v3-cyan);
          outline-offset: 2px;
        }
        .v3-cart-badge {
          background: #fff;
          color: var(--v3-red);
          border-radius: 999px;
          font-size: 11px;
          font-weight: 800;
          min-width: 18px;
          height: 18px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 0 4px;
        }
        @media (max-width: 860px) {
          .v3-header-inner {
            grid-template-columns: 1fr auto;
            gap: 10px;
          }
          .v3-header-support { display: none; }
        }
        @media (max-width: 520px) {
          .v3-wordmark { font-size: 18px; }
          .v3-search-input { font-size: 14px; min-height: 44px; }
        }
      `}</style>

      <header className="v3-header">
        <div className="v3-header-inner">
          <Link
            href="/preview/v3"
            className="v3-wordmark"
            aria-label="MotoMarket αρχική"
          >
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
