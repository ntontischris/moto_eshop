"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useLocale } from "next-intl";
import { usePathname } from "next/navigation";

interface ChatContextValue {
  isOpen: boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;
  chat: ReturnType<typeof useChat>;
}

const ChatContext = createContext<ChatContextValue | null>(null);

export function useChatContext(): ChatContextValue {
  const ctx = useContext(ChatContext);
  if (!ctx)
    throw new Error("useChatContext must be used inside <ChatProvider>");
  return ctx;
}

export function ChatProvider({ children }: { children: ReactNode }) {
  const [isOpen, setOpen] = useState(false);
  const locale = useLocale();
  const pathname = usePathname() ?? "/";

  const chat = useChat({
    transport: new DefaultChatTransport({
      api: "/api/chat",
      body: () => ({
        locale,
        pathname,
        cartItemCount: 0,
        cartTotalCents: 0,
        currency: "EUR",
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
