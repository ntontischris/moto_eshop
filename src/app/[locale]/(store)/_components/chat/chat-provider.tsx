"use client";

import {
  createContext,
  useContext,
  useState,
  useRef,
  useEffect,
  useLayoutEffect,
  type ReactNode,
} from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useLocale } from "next-intl";
import { usePathname } from "next/navigation";

import { useCoPilot } from "./use-co-pilot";
import { useCartSummary } from "./use-cart-summary";

interface ChatContextValue {
  isOpen: boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;
  chat: ReturnType<typeof useChat>;
  addToCart: (productId: string) => void;
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
  const cart = useCartSummary();
  const coPilot = useCoPilot();

  // Ref so the onToolCall closure always has access to the latest chat instance
  // without recreating the transport on every render.
  const chatRef = useRef<ReturnType<typeof useChat> | null>(null);

  // Stable co-pilot ref to avoid re-creating transport when coPilot fns change
  const coPilotRef = useRef(coPilot);
  useEffect(() => {
    coPilotRef.current = coPilot;
  });

  const chat = useChat({
    transport: new DefaultChatTransport({
      api: "/api/chat",
      body: () => ({
        locale,
        pathname,
        cartItemCount: cart.itemCount,
        cartTotalCents: cart.totalCents,
        currency: cart.currency,
      }),
    }),
    // v6 onToolCall: returns void — results must be submitted via addToolResult.
    // We read the latest chat instance from chatRef to avoid stale closures.
    onToolCall: async ({ toolCall }) => {
      const instance = chatRef.current;
      if (!instance) return;

      const { toolCallId, toolName } = toolCall;
      const input = toolCall.input as Record<string, unknown>;

      if (toolName === "navigateTo") {
        const result = coPilotRef.current.navigate(input.route as string);
        instance.addToolResult({
          tool: toolName as never,
          toolCallId,
          output: result,
        });
        return;
      }

      if (toolName === "applyFilters") {
        const result = coPilotRef.current.applyFilters(
          input.filters as Parameters<typeof coPilot.applyFilters>[0],
        );
        instance.addToolResult({
          tool: toolName as never,
          toolCallId,
          output: result,
        });
        return;
      }

      // Server-side tools (searchProducts, addToCart, etc.) execute on the
      // server and their results arrive in the stream — onToolCall is not
      // called for them.
    },
  });

  // Keep ref in sync after every render so onToolCall closure never goes stale.
  useLayoutEffect(() => {
    chatRef.current = chat;
  });

  // Quick add-to-cart from inline product cards — send as a user message so
  // the model sees context and calls the addToCart tool with full validation.
  const addToCart = (productId: string) => {
    chat.sendMessage({ text: `Πρόσθεσε στο καλάθι το προϊόν ${productId}` });
  };

  const value: ChatContextValue = {
    isOpen,
    open: () => setOpen(true),
    close: () => setOpen(false),
    toggle: () => setOpen((v) => !v),
    chat,
    addToCart,
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}
