"use client";

import { Link } from "@/i18n/navigation";
import { Bike, Home, Menu, Search, ShoppingBag } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
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

  useEffect(() => {
    const open = () => setDrawerOpen(true);
    window.addEventListener("v3:open-menu", open);
    return () => window.removeEventListener("v3:open-menu", open);
  }, []);

  return (
    <>
      <CategoryDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />

      <nav className="v3-mobile-nav" aria-label="Κινητή πλοήγηση">
        <Link href="/" className="v3-mob-item">
          <Home size={18} aria-hidden="true" />
          Home
        </Link>

        <button
          className="v3-mob-item"
          onClick={() => setDrawerOpen(true)}
          aria-label="Άνοιγμα κατηγοριών"
          aria-expanded={drawerOpen}
        >
          <Menu size={18} aria-hidden="true" />
          Menu
        </button>

        <button className="v3-mob-item" onClick={focusSearch} aria-label="Αναζήτηση">
          <Search size={18} aria-hidden="true" />
          Search
        </button>

        <a href="#my-bike" className="v3-mob-item">
          <Bike size={18} aria-hidden="true" />
          Bike
        </a>

        <button
          className="v3-mob-item"
          onClick={() => setCartOpen(true)}
          aria-label={`Καλάθι, ${cartCount} προϊόντα`}
        >
          <span className="v3-mob-badge">
            <ShoppingBag size={18} aria-hidden="true" />
            {cartCount > 0 && (
              <span className="v3-mob-badge-count" aria-hidden="true">
                {cartCount}
              </span>
            )}
          </span>
          Cart
        </button>
      </nav>
    </>
  );
}
