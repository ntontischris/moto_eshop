"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { ShoppingCart, User, Mic, Search, Menu, X, Bike } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Container } from "@/components/layout/container";
import { NAV_LINKS } from "@/components/layout/nav-links";
import { cn } from "@/lib/utils";

const CART_ITEM_COUNT = 0; // Replace with real store value

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

  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full transition-all duration-300",
        isScrolled
          ? "border-b border-border-default bg-bg-deep/90 backdrop-blur-md"
          : "border-b border-transparent bg-transparent",
      )}
    >
      {/* Top bar — announcement */}
      <div className="bg-brand-red py-1.5 text-center text-xs font-medium text-white">
        Δωρεάν αποστολή για αγορές άνω των 80€
      </div>

      {/* Main header */}
      <Container>
        <div className="flex h-16 items-center gap-4">
          {/* Logo */}
          <Link href="/" className="flex shrink-0 items-center gap-2">
            <Bike className="h-7 w-7 text-brand-red" />
            <span className="text-xl font-bold tracking-tight text-white">
              Moto<span className="text-brand-red">Market</span>
            </span>
          </Link>

          {/* Desktop nav links */}
          <nav className="hidden xl:flex xl:flex-1 xl:items-center xl:gap-1 xl:pl-4">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "relative flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium transition-colors duration-150",
                  pathname === link.href
                    ? "text-brand-red"
                    : "text-gray-300 hover:text-white",
                )}
              >
                {link.label}
                {link.badge && (
                  <Badge variant="sale" className="px-1.5 py-0 text-[10px]">
                    {link.badge}
                  </Badge>
                )}
                {pathname === link.href && (
                  <span className="absolute bottom-0 left-3 right-3 h-0.5 rounded-full bg-brand-red" />
                )}
              </Link>
            ))}
          </nav>

          {/* Search bar */}
          <div className="hidden flex-1 lg:flex lg:max-w-sm xl:max-w-md">
            <Input
              type="search"
              placeholder="Αναζήτηση εξοπλισμού..."
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              className="border-dark-3 bg-dark-2 text-white placeholder:text-gray-500 focus-visible:ring-brand-red"
              startIcon={<Search className="h-4 w-4" />}
              endIcon={
                <button
                  type="button"
                  aria-label="Φωνητική αναζήτηση"
                  className="text-gray-400 transition-colors hover:text-brand-red"
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

      {/* Mobile dropdown menu */}
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

            {/* Mobile nav links */}
            <nav className="flex flex-col pb-4">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setIsMenuOpen(false)}
                  className={cn(
                    "flex items-center justify-between rounded-md px-2 py-3 text-sm font-medium transition-colors",
                    pathname === link.href
                      ? "text-brand-red"
                      : "text-gray-300 hover:text-white",
                  )}
                >
                  {link.label}
                  {link.badge && (
                    <Badge variant="sale" className="text-[10px]">
                      {link.badge}
                    </Badge>
                  )}
                </Link>
              ))}
            </nav>
          </Container>
        </div>
      )}
    </header>
  );
};
