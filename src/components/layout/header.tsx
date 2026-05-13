"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import {
  ShoppingCart,
  User,
  Mic,
  Search,
  Menu,
  X,
  ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Container } from "@/components/layout/container";
import { cn } from "@/lib/utils";
import { useCart } from "@/lib/cart/cart-context";

// --- Types ---

interface CategoryNode {
  id: string;
  slug: string;
  full_path: string | null;
  name: string;
  parent_id: string | null;
  children: CategoryNode[];
}

interface HeaderProps {
  categoryTree: CategoryNode[];
  announcement?: { text: string; active: boolean };
}

interface SubCategory {
  label: string;
  href: string;
}

interface MenuCategory {
  label: string;
  href: string;
  badge?: string;
  columns: {
    title: string;
    titleHref?: string;
    items: SubCategory[];
  }[];
}

// --- Mega menu dropdown panel ---

interface MegaDropdownProps {
  category: MenuCategory;
  isOpen: boolean;
}

const MEGA_MAX_COLS_VISIBLE = 6;
const MEGA_MAX_ITEMS_PER_COL = 6;

const MegaDropdown = ({ category, isOpen }: MegaDropdownProps) => {
  const cols = category.columns.slice(0, MEGA_MAX_COLS_VISIBLE);
  const hasMoreCols = category.columns.length > MEGA_MAX_COLS_VISIBLE;
  const TEAL = "#14b8a6"; // explicit teal — bypass any tailwind theme issue

  return (
    <div
      style={{
        width: "880px",
        maxWidth: "95vw",
        position: "absolute",
        left: 0,
        top: "100%",
        zIndex: 50,
        background: "#141414",
        border: "1px solid #2a2a2a",
        borderTop: `2px solid ${TEAL}`,
        borderRadius: "0 0 12px 12px",
        boxShadow:
          "0 20px 40px -10px rgba(0,0,0,0.5), 0 8px 16px -4px rgba(0,0,0,0.3)",
        opacity: isOpen ? 1 : 0,
        transform: isOpen ? "translateY(0)" : "translateY(-4px)",
        pointerEvents: isOpen ? "auto" : "none",
        transition: "all 150ms ease-out",
        overflow: "hidden",
      }}
    >
      <div style={{ display: "flex", alignItems: "stretch" }}>
        {/* Left: explicit 3-column grid */}
        <div
          style={{
            flex: "1 1 0",
            display: "grid",
            gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
            gap: "16px 24px",
            padding: "24px 24px 20px",
          }}
        >
          {cols.map((col) => {
            const visibleItems = col.items.slice(0, MEGA_MAX_ITEMS_PER_COL);
            const extra = col.items.length - visibleItems.length;
            return (
              <div key={col.title} style={{ minWidth: 0 }}>
                {col.titleHref ? (
                  <Link
                    href={col.titleHref}
                    style={{
                      display: "block",
                      fontSize: "11px",
                      fontWeight: 700,
                      letterSpacing: "0.06em",
                      textTransform: "uppercase",
                      color: TEAL,
                      paddingBottom: "8px",
                      marginBottom: "8px",
                      borderBottom: "1px solid #262626",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                    className="hover:!text-white"
                  >
                    {col.title}
                  </Link>
                ) : (
                  <p
                    style={{
                      fontSize: "11px",
                      fontWeight: 700,
                      letterSpacing: "0.06em",
                      textTransform: "uppercase",
                      color: TEAL,
                      paddingBottom: "8px",
                      marginBottom: "8px",
                      borderBottom: "1px solid #262626",
                    }}
                  >
                    {col.title}
                  </p>
                )}
                {visibleItems.length > 0 && (
                  <ul
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "6px",
                      listStyle: "none",
                      padding: 0,
                      margin: 0,
                    }}
                  >
                    {visibleItems.map((item) => (
                      <li key={item.href}>
                        <Link
                          href={item.href}
                          style={{
                            display: "block",
                            fontSize: "13px",
                            lineHeight: 1.35,
                            color: "#d4d4d4",
                            padding: "3px 6px",
                            margin: "0 -6px",
                            borderRadius: "4px",
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            transition: "all 120ms",
                          }}
                          className="hover:!bg-white/5 hover:!text-white"
                        >
                          {item.label}
                        </Link>
                      </li>
                    ))}
                    {extra > 0 && (
                      <li>
                        <Link
                          href={col.titleHref ?? "#"}
                          style={{
                            display: "block",
                            fontSize: "11px",
                            color: "#737373",
                            marginTop: "2px",
                          }}
                          className="hover:!text-white"
                        >
                          +{extra} ακόμα →
                        </Link>
                      </li>
                    )}
                  </ul>
                )}
              </div>
            );
          })}
          {hasMoreCols && (
            <Link
              href={category.href}
              style={{
                gridColumn: "1 / -1",
                fontSize: "12px",
                fontWeight: 500,
                color: TEAL,
                marginTop: "4px",
              }}
              className="hover:!text-white"
            >
              Δες όλα στο {category.label} →
            </Link>
          )}
        </div>

        {/* Right: featured panel */}
        <Link
          href={category.href}
          style={{
            width: "220px",
            flexShrink: 0,
            display: "flex",
            flexDirection: "column",
            justifyContent: "flex-end",
            padding: "20px",
            background: `linear-gradient(135deg, ${TEAL}22 0%, #1a1a1a 60%, #0d0d0d 100%)`,
            borderLeft: "1px solid #262626",
            position: "relative",
            transition: "background 200ms",
          }}
          className="hover:!bg-neutral-800/50"
        >
          <div
            style={{
              position: "absolute",
              top: "20px",
              right: "20px",
              width: "32px",
              height: "32px",
              borderRadius: "50%",
              background: TEAL,
              color: "#0d0d0d",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 700,
              fontSize: "16px",
            }}
          >
            →
          </div>
          <p
            style={{
              fontSize: "10px",
              fontWeight: 700,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: TEAL,
              margin: 0,
            }}
          >
            Όλα τα προϊόντα
          </p>
          <p
            style={{
              fontSize: "20px",
              fontWeight: 700,
              lineHeight: 1.15,
              color: "white",
              marginTop: "6px",
              marginBottom: 0,
            }}
          >
            {category.label}
          </p>
          <p
            style={{
              fontSize: "12px",
              color: "#a3a3a3",
              marginTop: "8px",
              marginBottom: 0,
            }}
          >
            Δες ολόκληρη την κατηγορία
          </p>
        </Link>
      </div>
    </div>
  );
};

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

  const hasDropdown = category.columns.length > 0;

  return (
    <div
      className="relative"
      onMouseEnter={hasDropdown ? openMenu : undefined}
      onMouseLeave={hasDropdown ? closeMenu : undefined}
    >
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
        {hasDropdown && (
          <ChevronDown
            className={cn(
              "h-3.5 w-3.5 transition-transform duration-150",
              isOpen && "rotate-180",
            )}
          />
        )}
        {isActive && (
          <span className="absolute bottom-0 left-3 right-3 h-0.5 rounded-full bg-brand-teal" />
        )}
      </Link>

      {hasDropdown && <MegaDropdown category={category} isOpen={isOpen} />}
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
    <div className="border-b border-neutral-700 last:border-b-0">
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
              {col.titleHref ? (
                <Link
                  href={col.titleHref}
                  onClick={onLinkClick}
                  className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-brand-teal"
                >
                  {col.title}
                </Link>
              ) : (
                <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-brand-teal">
                  {col.title}
                </p>
              )}
              {col.items.length > 0 && (
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
              )}
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

export const Header = ({ categoryTree, announcement }: HeaderProps) => {
  const pathname = usePathname();
  const { itemCount: CART_ITEM_COUNT } = useCart();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [isScrolled, setIsScrolled] = useState(false);

  // 3-level mega menu using clean path-based URLs (Option B).
  // Each href = `/${node.full_path}` (e.g. /eksoplismos-anabath/endysh/mpoyfan).
  const hrefOf = (n: CategoryNode): string => `/${n.full_path ?? n.slug}`;
  const menuCategories: MenuCategory[] = categoryTree.map((node) => ({
    label: node.name,
    href: hrefOf(node),
    columns:
      node.children.length > 0
        ? node.children.map((child) => ({
            title: child.name,
            titleHref: hrefOf(child),
            items: child.children.map((grandchild) => ({
              label: grandchild.name,
              href: hrefOf(grandchild),
            })),
          }))
        : [],
  }));

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
          ? "border-b border-neutral-800 bg-[#1A1A1A]/95 backdrop-blur-md"
          : "border-b border-transparent bg-[#1A1A1A]",
      )}
    >
      {/* Announcement bar */}
      {announcement?.active && (
        <div className="bg-brand-teal py-1.5 text-center text-xs font-medium text-white">
          {announcement.text}
        </div>
      )}

      {/* Main header row */}
      <Container>
        <div className="flex h-16 items-center gap-4">
          {/* Logo */}
          <Link href="/" className="flex shrink-0 items-center">
            <Image
              src="/logo.png"
              alt="MotoMarket"
              width={160}
              height={48}
              className="h-10 w-auto"
              priority
            />
          </Link>

          {/* Desktop mega nav */}
          <nav className="hidden xl:flex xl:flex-1 xl:items-center xl:gap-0.5 xl:pl-4">
            {menuCategories.map((category) => (
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
              className="border-neutral-700 bg-[#222222] text-white placeholder:text-gray-500 focus-visible:ring-brand-teal"
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
        <div className="border-t border-neutral-700 bg-[#222222] xl:hidden">
          <Container>
            {/* Mobile search */}
            <div className="py-3">
              <Input
                type="search"
                placeholder="Αναζήτηση εξοπλισμού..."
                className="border-neutral-700 bg-[#2A2A2A] text-white placeholder:text-gray-500"
                startIcon={<Search className="h-4 w-4" />}
              />
            </div>

            {/* Accordion categories */}
            <nav className="flex flex-col pb-4">
              {menuCategories.map((category) => (
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
