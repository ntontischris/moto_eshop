"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Search, Bike, Heart, User, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface MobileTabItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

const MOBILE_TABS: MobileTabItem[] = [
  { label: "Αρχική", href: "/", icon: Home },
  { label: "Αναζήτηση", href: "/search", icon: Search },
  { label: "Garage", href: "/garage", icon: Bike },
  { label: "Wishlist", href: "/wishlist", icon: Heart },
  { label: "Λογαριασμός", href: "/account", icon: User },
];

export const MobileNav = () => {
  const pathname = usePathname();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-dark-3 bg-dark/95 backdrop-blur-sm md:hidden"
      aria-label="Mobile navigation"
    >
      <div className="flex h-16 items-stretch">
        {MOBILE_TABS.map(({ label, href, icon: Icon }) => {
          const isActive =
            pathname === href || (href !== "/" && pathname.startsWith(href));

          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "relative flex flex-1 flex-col items-center justify-center gap-1 transition-colors duration-150",
                isActive
                  ? "text-brand-red"
                  : "text-gray-500 hover:text-gray-300",
              )}
              aria-label={label}
              aria-current={isActive ? "page" : undefined}
            >
              <Icon
                className={cn(
                  "h-5 w-5 transition-transform duration-150",
                  isActive && "scale-110",
                )}
              />
              <span
                className={cn(
                  "text-[10px] font-medium leading-none",
                  isActive && "font-semibold",
                )}
              >
                {label}
              </span>
              {isActive && (
                <span className="absolute bottom-0 mx-auto h-0.5 w-8 rounded-full bg-brand-red" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
};
