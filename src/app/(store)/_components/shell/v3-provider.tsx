"use client";

import { createContext, useContext, useEffect, useRef, useState } from "react";

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
  removeFromCart(key: string): void;
  updateQty(key: string, qty: number): void;
  clearCart(): void;
  cartCount: number;
  cartTotal: number;
  cartOpen: boolean;
  setCartOpen(b: boolean): void;
  wishlist: string[];
  toggleWishlist(slug: string): void;
}

const Ctx = createContext<V3Context | null>(null);

const CART_KEY = "mm-v3-cart";
const WISH_KEY = "mm-v3-wishlist";

function load<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function V3Provider({ children }: { children: React.ReactNode }) {
  const [lang, setLang] = useState<"el" | "en">("el");
  const [cart, setCart] = useState<CartLine[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [wishlist, setWishlist] = useState<string[]>([]);
  const hydrated = useRef(false);

  // Load persisted state once on mount (SSR-safe — empty on first render,
  // so server and client markup match; populated right after).
  useEffect(() => {
    setCart(load<CartLine[]>(CART_KEY, []));
    setWishlist(load<string[]>(WISH_KEY, []));
    hydrated.current = true;
  }, []);

  // Persist on change (skip the pre-hydration render so we don't clobber
  // stored data with the initial empty arrays).
  useEffect(() => {
    if (!hydrated.current) return;
    try {
      window.localStorage.setItem(CART_KEY, JSON.stringify(cart));
    } catch {
      /* quota/private-mode — ignore */
    }
  }, [cart]);

  useEffect(() => {
    if (!hydrated.current) return;
    try {
      window.localStorage.setItem(WISH_KEY, JSON.stringify(wishlist));
    } catch {
      /* ignore */
    }
  }, [wishlist]);

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

  function removeFromCart(key: string) {
    setCart((prev) => prev.filter((l) => cartLineKey(l) !== key));
  }

  function updateQty(key: string, qty: number) {
    setCart((prev) =>
      qty <= 0
        ? prev.filter((l) => cartLineKey(l) !== key)
        : prev.map((l) => (cartLineKey(l) === key ? { ...l, qty } : l)),
    );
  }

  function clearCart() {
    setCart([]);
  }

  function toggleWishlist(slug: string) {
    setWishlist((prev) =>
      prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug],
    );
  }

  const cartCount = cart.reduce((sum, l) => sum + l.qty, 0);
  const cartTotal = cart.reduce((sum, l) => sum + l.price * l.qty, 0);

  return (
    <Ctx.Provider
      value={{
        lang,
        setLang,
        cart,
        addToCart,
        removeFromCart,
        updateQty,
        clearCart,
        cartCount,
        cartTotal,
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
