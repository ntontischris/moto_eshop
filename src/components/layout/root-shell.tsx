"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

/**
 * Decides whether to wrap children with the legacy site chrome
 * (Header/Footer/MobileNav) or render them bare.
 *
 * Routes that ship with their own chrome (the new Moto Market landing
 * and any /preview/* route) render unwrapped.
 */
export function RootShell({
  chrome,
  children,
}: {
  chrome: ReactNode;
  children: ReactNode;
}) {
  const pathname = usePathname() ?? "/";
  const isBare =
    pathname === "/" ||
    pathname.startsWith("/preview") ||
    pathname.startsWith("/product/") ||
    pathname.startsWith("/category/");

  if (isBare) {
    return <main className="min-h-screen">{children}</main>;
  }

  return <>{chrome}</>;
}
