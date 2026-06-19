"use client";

import { createContext, useContext, useEffect, useRef, useState } from "react";
import {
  shouldAnimateThemeSwitch,
  wipeEndRadius,
  wipeOriginFromRect,
} from "../../_lib/theme-transition";
import { cartLineKey, type CartLine } from "../../_lib/cart-line";
import {
  addToCart as serverAddToCart,
  removeFromCart as serverRemoveFromCart,
  updateQuantity as serverUpdateQuantity,
  changeItemSize as serverChangeItemSize,
  getCartLines,
  clearCart as serverClearCart,
} from "@/lib/actions/cart";
import { setWishlistItem, syncWishlistOnLoad } from "@/lib/actions/wishlist";

// Single home for the cart-line shape + key is `_lib/cart-line`; re-exported
// here so the many existing `import { CartLine, cartLineKey } from ".../v3-provider"`
// call sites keep working.
export { cartLineKey };
export type { CartLine };

/* DOMRect-ish input for the wipe origin — only the fields we read, so callers
   can pass a real getBoundingClientRect() result without extra plumbing. */
type ToggleOrigin = {
  left: number;
  top: number;
  width: number;
  height: number;
} | null;

interface V3Context {
  mode: "dark" | "light";
  toggleMode(origin?: ToggleOrigin): void;
  cart: CartLine[];
  addToCart(input: Omit<CartLine, "id">): Promise<{ ok: boolean }>;
  removeFromCart(id: string): void;
  updateQty(id: string, qty: number): void;
  changeLineSize(
    id: string,
    newSize: string,
  ): Promise<{ ok: boolean; error?: string }>;
  clearCart(): void;
  cartCount: number;
  cartTotal: number;
  cartOpen: boolean;
  setCartOpen(b: boolean): void;
  wishlist: string[];
  toggleWishlist(slug: string): void;
}

const Ctx = createContext<V3Context | null>(null);

const WISH_KEY = "mm-v3-wishlist";
const MODE_KEY = "mm-v3-mode";

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
  const [mode, setMode] = useState<"dark" | "light">("dark");
  const [cart, setCart] = useState<CartLine[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [wishlist, setWishlist] = useState<string[]>([]);
  const hydrated = useRef(false);
  // True once the wishlist is account-backed (logged in): the DB is the store,
  // so we stop mirroring it to localStorage and write favourites through.
  const accountBacked = useRef(false);

  // Load persisted state once on mount (SSR-safe — empty on first render,
  // so server and client markup match; populated right after). The cart is
  // server-backed (single source of truth); the wishlist reconciles with the
  // account so a logged-in user merges their local [Guest wishlist] into the
  // [Persisted wishlist] and switches to account-backed.
  useEffect(() => {
    queueMicrotask(async () => {
      const localWish = load<string[]>(WISH_KEY, []);
      setWishlist(localWish);
      setMode(load<"dark" | "light">(MODE_KEY, "dark"));
      hydrated.current = true;

      // Cart: load the current server cart (guest cookie cart or account cart).
      try {
        setCart(await getCartLines());
      } catch {
        /* offline — leave empty; the next mutation re-syncs */
      }

      try {
        const res = await syncWishlistOnLoad(localWish);
        if (res.account) {
          accountBacked.current = true;
          setWishlist(res.slugs);
          // Guest store merged into the account — clear it (#136).
          try {
            window.localStorage.removeItem(WISH_KEY);
          } catch {
            /* ignore */
          }
        }
      } catch {
        /* offline / action failed — stay on the local guest wishlist */
      }
    });
  }, []);

  useEffect(() => {
    document.documentElement.dataset.v3Mode = mode;
    if (!hydrated.current) return;
    try {
      window.localStorage.setItem(MODE_KEY, JSON.stringify(mode));
    } catch {
      /* ignore */
    }
  }, [mode]);

  useEffect(() => {
    if (!hydrated.current) return;
    // Account-backed wishlist lives in the DB, not localStorage.
    if (accountBacked.current) return;
    try {
      window.localStorage.setItem(WISH_KEY, JSON.stringify(wishlist));
    } catch {
      /* ignore */
    }
  }, [wishlist]);

  // Re-pull the authoritative cart after a server mutation.
  async function refreshCart() {
    try {
      setCart(await getCartLines());
    } catch {
      /* keep the optimistic state if the refresh fails */
    }
  }

  // Server-authoritative add. Per-size stock is validated inside the action, so
  // a stale page can't oversell; on success we re-sync from the server.
  async function addToCart(
    input: Omit<CartLine, "id">,
  ): Promise<{ ok: boolean }> {
    const res = await serverAddToCart({
      productId: input.productId,
      quantity: input.qty,
      unitPrice: input.price,
      size: input.size,
    });
    if (!res.success) return { ok: false };
    await refreshCart();
    return { ok: true };
  }

  function removeFromCart(id: string) {
    setCart((prev) => prev.filter((l) => l.id !== id)); // optimistic
    void serverRemoveFromCart({ cartItemId: id }).then(refreshCart);
  }

  function updateQty(id: string, qty: number) {
    setCart((prev) =>
      qty <= 0
        ? prev.filter((l) => l.id !== id)
        : prev.map((l) => (l.id === id ? { ...l, qty } : l)),
    ); // optimistic
    void serverUpdateQuantity({ cartItemId: id, quantity: qty }).then(
      refreshCart,
    );
  }

  // Change a line's [Size code] (B1) — validated + merged server-side.
  async function changeLineSize(
    id: string,
    newSize: string,
  ): Promise<{ ok: boolean; error?: string }> {
    const res = await serverChangeItemSize({ cartItemId: id, size: newSize });
    if (!res.success) return { ok: false, error: res.error };
    await refreshCart();
    return { ok: true };
  }

  function clearCart() {
    setCart([]); // optimistic
    void serverClearCart();
  }

  function toggleWishlist(slug: string) {
    const willAdd = !wishlist.includes(slug);
    setWishlist((prev) =>
      prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug],
    );
    // Logged in: persist the favourite to the account (slug→UUID server-side).
    if (accountBacked.current) {
      void setWishlistItem(slug, willAdd);
    }
  }

  function flipMode() {
    setMode((current) => (current === "dark" ? "light" : "dark"));
  }

  /* Switch theme with a circular View-Transition wipe originating at the toggle
     button. Falls back to an instant flip when View Transitions are unsupported
     or the user prefers reduced motion (the toggle still works either way). */
  function toggleMode(origin?: ToggleOrigin) {
    const root = document.documentElement;
    const supports =
      typeof (
        document as Document & {
          startViewTransition?: unknown;
        }
      ).startViewTransition === "function";
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    if (!shouldAnimateThemeSwitch(supports, prefersReducedMotion)) {
      flipMode();
      return;
    }

    const viewport = {
      width: window.innerWidth,
      height: window.innerHeight,
    };
    const point = wipeOriginFromRect(origin ?? null, viewport);
    const radius = wipeEndRadius(point, viewport);
    root.style.setProperty("--v3-vt-x", `${point.x}px`);
    root.style.setProperty("--v3-vt-y", `${point.y}px`);
    root.style.setProperty("--v3-vt-r", `${radius}px`);

    (
      document as Document & {
        startViewTransition: (cb: () => void) => void;
      }
    ).startViewTransition(() => {
      flipMode();
    });
  }

  const cartCount = cart.reduce((sum, l) => sum + l.qty, 0);
  const cartTotal = cart.reduce((sum, l) => sum + l.price * l.qty, 0);

  return (
    <Ctx.Provider
      value={{
        mode,
        toggleMode,
        cart,
        addToCart,
        removeFromCart,
        updateQty,
        changeLineSize,
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
