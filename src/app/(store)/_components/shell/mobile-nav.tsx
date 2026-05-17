"use client";

import Link from "next/link";
import { useCallback, useState } from "react";
import { useV3 } from "./v3-provider";
import { CategoryDrawer } from "./category-drawer";

export function MobileNav() {
  const { cartCount, setCartOpen } = useV3();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const focusSearch = useCallback(() => {
    const input = document.querySelector<HTMLInputElement>(".v3-search-input");
    input?.focus();
    input?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, []);

  return (
    <>
      <style>{`
        .v3-mobile-nav {
          display: none;
        }
        @media (max-width: 860px) {
          .v3-mobile-nav {
            display: flex;
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            height: 60px;
            background: var(--v3-graphite);
            border-top: 1px solid var(--v3-line);
            z-index: 400;
            align-items: stretch;
          }
        }
        .v3-mob-item {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          background: none;
          border: none;
          color: var(--v3-bone-dim);
          cursor: pointer;
          font-family: var(--v3-font);
          font-size: 10px;
          gap: 3px;
          text-decoration: none;
          transition: color .15s;
        }
        .v3-mob-item:hover, .v3-mob-item:focus-visible { color: var(--v3-bone); }
        .v3-mob-item:focus-visible {
          outline: 2px solid var(--v3-cyan);
          outline-offset: -2px;
        }
        .v3-mob-icon { font-size: 18px; line-height: 1; }
        .v3-mob-badge {
          position: relative;
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }
        .v3-mob-badge-count {
          position: absolute;
          top: -4px;
          right: -8px;
          background: var(--v3-red);
          color: #fff;
          border-radius: 999px;
          font-size: 9px;
          font-weight: 800;
          min-width: 15px;
          height: 15px;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0 3px;
        }
        @media (prefers-reduced-motion: reduce) {
          .v3-mobile-nav, .v3-mob-item { transition: none; }
        }
      `}</style>

      <CategoryDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />

      <nav className="v3-mobile-nav" aria-label="Κινητή πλοήγηση">
        <Link href="/" className="v3-mob-item">
          <span className="v3-mob-icon" aria-hidden="true">
            🏠
          </span>
          Αρχική
        </Link>

        <button
          className="v3-mob-item"
          onClick={() => setDrawerOpen(true)}
          aria-label="Άνοιγμα κατηγοριών"
          aria-expanded={drawerOpen}
        >
          <span className="v3-mob-icon" aria-hidden="true">
            ☰
          </span>
          Κατηγορίες
        </button>

        <button
          className="v3-mob-item"
          onClick={focusSearch}
          aria-label="Αναζήτηση"
        >
          <span className="v3-mob-icon" aria-hidden="true">
            🔍
          </span>
          Αναζήτηση
        </button>

        <button
          className="v3-mob-item"
          onClick={() => setCartOpen(true)}
          aria-label={`Καλάθι, ${cartCount} προϊόντα`}
        >
          <span className="v3-mob-badge">
            <span className="v3-mob-icon" aria-hidden="true">
              🛒
            </span>
            {cartCount > 0 && (
              <span className="v3-mob-badge-count" aria-hidden="true">
                {cartCount}
              </span>
            )}
          </span>
          Καλάθι
        </button>

        <a href="#" className="v3-mob-item" aria-label="Λίστα επιθυμιών">
          <span className="v3-mob-icon" aria-hidden="true">
            ♡
          </span>
          Λίστα
        </a>
      </nav>
    </>
  );
}
