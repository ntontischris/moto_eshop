"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  type ReactNode,
} from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useLocale } from "next-intl";
import { usePathname } from "next/navigation";
import type { CartSummary } from "@/app/api/cart/summary/route";

interface ChatContextValue {
  isOpen: boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;
  chat: ReturnType<typeof useChat>;
}

const CartSummaryDefault: CartSummary = {
  itemCount: 0,
  totalCents: 0,
  currency: "EUR",
};

const ChatContext = createContext<ChatContextValue | null>(null);

export function useChatContext(): ChatContextValue {
  const ctx = useContext(ChatContext);
  if (!ctx)
    throw new Error("useChatContext must be used inside <ChatProvider>");
  return ctx;
}

function useCartSummary(): CartSummary {
  const [summary, setSummary] = useState<CartSummary>(CartSummaryDefault);
  const fetched = useRef(false);

  useEffect(() => {
    if (fetched.current) return;
    fetched.current = true;

    fetch("/api/cart/summary")
      .then((res) => res.json() as Promise<CartSummary>)
      .then(setSummary)
      .catch(() => {
        // keep defaults on error — non-critical
      });
  }, []);

  return summary;
}

export function ChatProvider({ children }: { children: ReactNode }) {
  const [isOpen, setOpen] = useState(false);
  const locale = useLocale();
  const pathname = usePathname() ?? "/";
  const cartSummary = useCartSummary();

  const chat = useChat({
    transport: new DefaultChatTransport({
      api: "/api/chat",
      body: () => ({
        locale,
        pathname,
        cartItemCount: cartSummary.itemCount,
        cartTotalCents: cartSummary.totalCents,
        currency: cartSummary.currency,
      }),
    }),
  });

  const value: ChatContextValue = {
    isOpen,
    open: () => setOpen(true),
    close: () => setOpen(false),
    toggle: () => setOpen((v) => !v),
    chat,
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}
