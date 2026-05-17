"use client";

import { createContext, useContext, useState } from "react";

export interface CartLine {
  slug: string;
  name: string;
  brand: string;
  price: number;
  size: string | null;
  image: string;
  qty: number;
}

export function cartLineKey(line: Pick<CartLine, "slug" | "size">): string {
  return `${line.slug}::${line.size ?? ""}`;
}

interface V3Context {
  lang: "el" | "en";
  setLang(l: "el" | "en"): void;
  cart: CartLine[];
  addToCart(line: CartLine): void;
  cartCount: number;
  cartOpen: boolean;
  setCartOpen(b: boolean): void;
  wishlist: string[];
  toggleWishlist(slug: string): void;
}

const Ctx = createContext<V3Context | null>(null);

export function V3Provider({ children }: { children: React.ReactNode }) {
  const [lang, setLang] = useState<"el" | "en">("el");
  const [cart, setCart] = useState<CartLine[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [wishlist, setWishlist] = useState<string[]>([]);

  function addToCart(line: CartLine) {
    setCart((prev) => {
      const key = cartLineKey(line);
      const idx = prev.findIndex((l) => cartLineKey(l) === key);
      if (idx !== -1) {
        const next = [...prev];
        next[idx] = { ...next[idx], qty: next[idx].qty + line.qty };
        return next;
      }
      return [...prev, line];
    });
  }

  function toggleWishlist(slug: string) {
    setWishlist((prev) =>
      prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug],
    );
  }

  const cartCount = cart.reduce((sum, l) => sum + l.qty, 0);

  return (
    <Ctx.Provider
      value={{
        lang,
        setLang,
        cart,
        addToCart,
        cartCount,
        cartOpen,
        setCartOpen,
        wishlist,
        toggleWishlist,
      }}
    >
      {children}
    </Ctx.Provider>
  );
}

export function useV3(): V3Context {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useV3 must be used inside V3Provider");
  return ctx;
}
