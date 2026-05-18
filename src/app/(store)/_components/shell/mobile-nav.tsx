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
