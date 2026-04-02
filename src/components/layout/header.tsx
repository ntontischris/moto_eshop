"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import {
  ShoppingCart,
  User,
  Mic,
  Search,
  Menu,
  X,
  Bike,
  ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Container } from "@/components/layout/container";
import {
  MENU_CATEGORIES,
  type MenuCategory,
} from "@/components/layout/mega-menu-data";
import { cn } from "@/lib/utils";

const CART_ITEM_COUNT = 0; // Replace with real store value

// --- Mega menu dropdown panel ---

interface MegaDropdownProps {
  category: MenuCategory;
  isOpen: boolean;
}

const MegaDropdown = ({ category, isOpen }: MegaDropdownProps) => (
  <div
    className={cn(
      "absolute left-0 top-full z-50 min-w-[480px] rounded-b-lg border border-border-default bg-bg-surface shadow-xl transition-all duration-150",
      isOpen
        ? "pointer-events-auto opacity-100 translate-y-0"
        : "pointer-events-none opacity-0 -translate-y-1",
    )}
  >
    <div className="flex gap-8 p-6">
      {category.columns.map((col) => (
        <div key={col.title} className="min-w-[120px]">
          <p className="mb-3 text-sm font-semibold uppercase tracking-wide text-brand-teal">
            {col.title}
          </p>
          <ul className="flex flex-col gap-1.5">
            {col.items.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="text-sm text-text-secondary transition-colors hover:text-brand-teal"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  </div>
);

// --- Single desktop nav item with dropdown ---

interface NavItemProps {
  category: MenuCategory;
  isActive: boolean;
}

const NavItem = ({ category, isActive }: NavItemProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const openMenu = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setIsOpen(true);
  };

  const closeMenu = () => {
    timeoutRef.current = setTimeout(() => setIsOpen(false), 80);
  };

  useEffect(
    () => () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    },
    [],
  );

  return (
    <div className="relative" onMouseEnter={openMenu} onMouseLeave={closeMenu}>
      <Link
        href={category.href}
        className={cn(
          "relative flex items-center gap-1 rounded-md px-3 py-2 text-sm font-medium transition-colors duration-150",
          isActive ? "text-brand-teal" : "text-gray-300 hover:text-white",
        )}
        aria-expanded={isOpen}
      >
        {category.label}
        {category.badge && (
          <Badge variant="sale" className="px-1.5 py-0 text-[10px]">
            {category.badge}
          </Badge>
        )}
        <ChevronDown
          className={cn(
            "h-3.5 w-3.5 transition-transform duration-150",
            isOpen && "rotate-180",
          )}
        />
        {isActive && (
          <span className="absolute bottom-0 left-3 right-3 h-0.5 rounded-full bg-brand-teal" />
        )}
      </Link>

      <MegaDropdown category={category} isOpen={isOpen} />
    </div>
  );
};

// --- Mobile accordion category ---

interface MobileNavCategoryProps {
  category: MenuCategory;
  isActive: boolean;
  onLinkClick: () => void;
}

const MobileNavCategory = ({
  category,
  isActive,
  onLinkClick,
}: MobileNavCategoryProps) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="border-b border-dark-3 last:border-b-0">
      <button
        type="button"
        onClick={() => setIsExpanded((prev) => !prev)}
        className={cn(
          "flex w-full items-center justify-between px-2 py-3 text-sm font-medium transition-colors",
          isActive ? "text-brand-teal" : "text-gray-300",
        )}
      >
        <span className="flex items-center gap-2">
          {category.label}
          {category.badge && (
            <Badge variant="sale" className="text-[10px]">
              {category.badge}
            </Badge>
          )}
        </span>
        <ChevronDown
          className={cn(
            "h-4 w-4 transition-transform duration-150",
            isExpanded && "rotate-180",
          )}
        />
      </button>

      {isExpanded && (
        <div className="pb-3 pl-4">
          {category.columns.map((col) => (
            <div key={col.title} className="mb-3">
              <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-brand-teal">
                {col.title}
              </p>
              <ul className="flex flex-col gap-1">
                {col.items.map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={onLinkClick}
                      className="text-sm text-text-secondary transition-colors hover:text-brand-teal"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
          <Link
            href={category.href}
            onClick={onLinkClick}
            className="mt-1 inline-block text-sm font-medium text-brand-teal hover:underline"
          >
            Δείτε όλα →
          </Link>
        </div>
      )}
    </div>
  );
};

// --- Main header ---

export const Header = () => {
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const closeMenu = () => setIsMenuOpen(false);

  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full transition-all duration-300",
        isScrolled
          ? "border-b border-border-default bg-bg-deep/90 backdrop-blur-md"
          : "border-b border-transparent bg-transparent",
      )}
    >
      {/* Announcement bar */}
      <div className="bg-brand-teal py-1.5 text-center text-xs font-medium text-white">
        Δωρεάν αποστολή για αγορές άνω των 80€
      </div>

      {/* Main header row */}
      <Container>
        <div className="flex h-16 items-center gap-4">
          {/* Logo */}
          <Link href="/" className="flex shrink-0 items-center gap-2">
            <Bike className="h-7 w-7 text-brand-teal" />
            <span className="text-xl font-bold tracking-tight text-white">
              Moto<span className="text-brand-teal">Market</span>
            </span>
          </Link>

          {/* Desktop mega nav */}
          <nav className="hidden xl:flex xl:flex-1 xl:items-center xl:gap-0.5 xl:pl-4">
            {MENU_CATEGORIES.map((category) => (
              <NavItem
                key={category.href}
                category={category}
                isActive={
                  pathname.startsWith(category.href) && category.href !== "/"
                }
              />
            ))}
          </nav>

          {/* Desktop search */}
          <div className="hidden flex-1 lg:flex lg:max-w-sm xl:max-w-md">
            <Input
              type="search"
              placeholder="Αναζήτηση εξοπλισμού..."
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              className="border-dark-3 bg-dark-2 text-white placeholder:text-gray-500 focus-visible:ring-brand-teal"
              startIcon={<Search className="h-4 w-4" />}
              endIcon={
                <button
                  type="button"
                  aria-label="Φωνητική αναζήτηση"
                  className="text-gray-400 transition-colors hover:text-brand-teal"
                >
                  <Mic className="h-4 w-4" />
                </button>
              }
            />
          </div>

          {/* Right actions */}
          <div className="ml-auto flex items-center gap-1">
            {/* Mobile search toggle */}
            <Button
              variant="ghost"
              size="icon"
              className="text-gray-300 hover:text-white lg:hidden"
            >
              <Search className="h-5 w-5" />
              <span className="sr-only">Αναζήτηση</span>
            </Button>

            {/* Cart */}
            <Button
              variant="ghost"
              size="icon"
              className="relative text-gray-300 hover:text-white"
              render={<Link href="/cart" />}
            >
              <ShoppingCart className="h-5 w-5" />
              {CART_ITEM_COUNT > 0 && (
                <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-brand-red text-[10px] font-bold text-white">
                  {CART_ITEM_COUNT}
                </span>
              )}
              <span className="sr-only">Καλάθι</span>
            </Button>

            {/* Account */}
            <Button
              variant="ghost"
              size="icon"
              className="text-gray-300 hover:text-white"
              render={<Link href="/account" />}
            >
              <User className="h-5 w-5" />
              <span className="sr-only">Λογαριασμός</span>
            </Button>

            {/* Mobile hamburger */}
            <Button
              variant="ghost"
              size="icon"
              className="text-gray-300 hover:text-white xl:hidden"
              onClick={() => setIsMenuOpen((prev) => !prev)}
              aria-label={isMenuOpen ? "Κλείσιμο μενού" : "Άνοιγμα μενού"}
            >
              {isMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </Button>
          </div>
        </div>
      </Container>

      {/* Mobile drawer */}
      {isMenuOpen && (
        <div className="border-t border-dark-3 bg-dark-2 xl:hidden">
          <Container>
            {/* Mobile search */}
            <div className="py-3">
              <Input
                type="search"
                placeholder="Αναζήτηση εξοπλισμού..."
                className="border-dark-3 bg-dark-3 text-white placeholder:text-gray-500"
                startIcon={<Search className="h-4 w-4" />}
              />
            </div>

            {/* Accordion categories */}
            <nav className="flex flex-col pb-4">
              {MENU_CATEGORIES.map((category) => (
                <MobileNavCategory
                  key={category.href}
                  category={category}
                  isActive={
                    pathname.startsWith(category.href) && category.href !== "/"
                  }
                  onLinkClick={closeMenu}
                />
              ))}
            </nav>
          </Container>
        </div>
      )}
    </header>
  );
};
