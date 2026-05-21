"use client";

import Link from "next/link";
import Image from "next/image";
import { Menu, Moon, Search, ShoppingBag, Sun, Tag, Zap } from "lucide-react";
import { useRouter } from "next/navigation";
import { useV3 } from "./v3-provider";
import { CartPanel } from "./cart-panel";

export function Header() {
  const { cartCount, cartOpen, setCartOpen, mode, toggleMode } = useV3();
  const router = useRouter();

  function onSearch(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const q = String(new FormData(e.currentTarget).get("q") ?? "").trim();
    if (q.length >= 2) router.push(`/search?q=${encodeURIComponent(q)}`);
  }

  function openMenu() {
    window.dispatchEvent(new CustomEvent("v3:open-menu"));
  }

  return (
    <>
      <header className="v3-header v3-header--reconstructed">
        <div className="v3-header-inner">
          <Link href="/" className="v3-wordmark" aria-label="MotoMarket αρχική">
            <span className="v3-wordmark-logo">
              <Image src="/logo.png" alt="" width={188} height={56} priority />
            </span>
          </Link>

          <form role="search" className="v3-search-form" onSubmit={onSearch}>
            <Search className="v3-search-icon" size={18} aria-hidden="true" />
            <input
              type="search"
              name="q"
              className="v3-search-input"
              aria-label="Αναζήτηση προϊόντων"
              placeholder="Κράνος, μπουφάν, AGV, GIVI, Quad Lock..."
              autoComplete="off"
            />
            <button className="v3-search-submit" type="submit" aria-label="Αναζήτηση">
              <Zap size={15} aria-hidden="true" />
            </button>
          </form>

          <div className="v3-header-actions">
            <Link href="/category/prosfores" className="v3-header-drop">
              <Tag size={15} aria-hidden="true" />
              Προσφορές
            </Link>

            <button
              className="v3-mode-toggle"
              type="button"
              onClick={toggleMode}
              aria-label={
                mode === "dark"
                  ? "Άνοιγμα ανοιχτής έκδοσης"
                  : "Άνοιγμα σκοτεινής έκδοσης"
              }
            >
              {mode === "dark" ? (
                <Sun size={17} aria-hidden="true" />
              ) : (
                <Moon size={17} aria-hidden="true" />
              )}
              <span>{mode === "dark" ? "Light" : "Dark"}</span>
            </button>

            <button
              className="v3-cart-btn"
              onClick={() => setCartOpen(!cartOpen)}
              aria-label={`Καλάθι, ${cartCount} προϊόντα`}
              aria-expanded={cartOpen}
            >
              <ShoppingBag size={17} aria-hidden="true" />
              <span>Καλάθι</span>
              {cartCount > 0 && (
                <span className="v3-cart-badge" aria-hidden="true">
                  {cartCount}
                </span>
              )}
            </button>
          </div>

          <button
            className="v3-header-menu"
            type="button"
            aria-label="Άνοιγμα μενού"
            onClick={openMenu}
          >
            <Menu size={20} aria-hidden="true" />
          </button>
        </div>
      </header>

      <CartPanel />
    </>
  );
}
