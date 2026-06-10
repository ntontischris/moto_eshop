"use client";

import { Link } from "@/i18n/navigation";
import Image from "next/image";
import { Menu, Moon, Search, ShoppingBag, Sun, Tag } from "lucide-react";
import { useTranslations } from "next-intl";
import { useV3 } from "./v3-provider";
import { useCommandPalette } from "./command-palette-provider";
import { CartPanel } from "./cart-panel";
import { LanguageSwitcher } from "./language-switcher";

export function Header() {
  const t = useTranslations("shell");
  const tc = useTranslations("common");
  const tp = useTranslations("palette");
  const { cartCount, cartOpen, setCartOpen, mode, toggleMode } = useV3();
  const { openPalette } = useCommandPalette();

  function openMenu() {
    window.dispatchEvent(new CustomEvent("v3:open-menu"));
  }

  return (
    <>
      <header className="v3-header v3-header--reconstructed">
        <div className="v3-header-inner">
          <Link href="/" className="v3-wordmark" aria-label={t("headerHome")}>
            <span className="v3-wordmark-logo">
              <Image src="/logo.png" alt="" width={188} height={56} priority />
            </span>
          </Link>

          <button
            type="button"
            className="v3-search-form v3-search-trigger"
            onClick={openPalette}
            aria-label={t("headerSearchInput")}
            aria-keyshortcuts="Meta+K Control+K"
          >
            <Search className="v3-search-icon" size={18} aria-hidden="true" />
            <span className="v3-search-placeholder">
              {t("headerSearchPlaceholder")}
            </span>
            <kbd className="v3-search-kbd" aria-hidden="true">
              {tp("shortcut")}
            </kbd>
          </button>

          <div className="v3-header-actions">
            <Link href="/prosfores" className="v3-header-drop">
              <Tag size={15} aria-hidden="true" />
              {t("headerOffers")}
            </Link>

            <button
              className="v3-mode-toggle"
              type="button"
              onClick={(e) =>
                toggleMode(e.currentTarget.getBoundingClientRect())
              }
              aria-label={
                mode === "dark" ? t("headerLightMode") : t("headerDarkMode")
              }
            >
              {mode === "dark" ? (
                <Sun size={17} aria-hidden="true" />
              ) : (
                <Moon size={17} aria-hidden="true" />
              )}
              <span>{mode === "dark" ? "Light" : "Dark"}</span>
            </button>

            <LanguageSwitcher />

            <button
              className="v3-cart-btn"
              onClick={() => setCartOpen(!cartOpen)}
              aria-label={t("headerCartLabel", { count: cartCount })}
              aria-expanded={cartOpen}
            >
              <ShoppingBag size={17} aria-hidden="true" />
              <span>{tc("cart")}</span>
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
            aria-label={t("headerOpenMenu")}
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
