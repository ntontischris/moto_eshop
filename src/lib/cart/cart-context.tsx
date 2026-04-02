"use client";

import {
  createContext,
  useContext,
  useOptimistic,
  startTransition,
  type ReactNode,
} from "react";

interface CartContextValue {
  itemCount: number;
  optimisticIncrement: (delta: number) => void;
}

const CartContext = createContext<CartContextValue>({
  itemCount: 0,
  optimisticIncrement: () => undefined,
});

interface CartProviderProps {
  children: ReactNode;
  initialCount: number;
}

export function CartProvider({ children, initialCount }: CartProviderProps) {
  const [optimisticCount, setOptimisticCount] = useOptimistic(
    initialCount,
    (current: number, delta: number) => Math.max(0, current + delta),
  );

  function optimisticIncrement(delta: number) {
    startTransition(() => {
      setOptimisticCount(delta);
    });
  }

  return (
    <CartContext.Provider
      value={{ itemCount: optimisticCount, optimisticIncrement }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  return useContext(CartContext);
}
