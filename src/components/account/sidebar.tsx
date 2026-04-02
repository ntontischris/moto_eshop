"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  User,
  ShoppingBag,
  Star,
  Heart,
  LogOut,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { signOut } from "@/lib/auth/actions";

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
}

const NAV_ITEMS: NavItem[] = [
  { href: "/account", label: "Επισκόπηση", icon: <User className="h-4 w-4" /> },
  {
    href: "/account/profile",
    label: "Προφίλ",
    icon: <User className="h-4 w-4" />,
  },
  {
    href: "/account/orders",
    label: "Παραγγελίες",
    icon: <ShoppingBag className="h-4 w-4" />,
  },
  {
    href: "/account/wishlist",
    label: "Αγαπημένα",
    icon: <Heart className="h-4 w-4" />,
  },
  {
    href: "/account/points",
    label: "Πόντοι",
    icon: <Star className="h-4 w-4" />,
  },
];

export function AccountSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-full shrink-0 md:w-56">
      <nav className="space-y-1">
        {NAV_ITEMS.map((item) => {
          const isActive =
            item.href === "/account"
              ? pathname === "/account"
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
              )}
            >
              <span className="flex items-center gap-3">
                {item.icon}
                {item.label}
              </span>
              {isActive && <ChevronRight className="h-4 w-4 opacity-60" />}
            </Link>
          );
        })}

        <form
          action={async () => {
            await signOut();
          }}
        >
          <button
            type="submit"
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
          >
            <LogOut className="h-4 w-4" />
            Αποσύνδεση
          </button>
        </form>
      </nav>
    </aside>
  );
}
