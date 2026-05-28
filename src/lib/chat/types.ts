import type { UIMessage } from "ai";
import type {
  ChatMessageRow,
  ChatThreadRow,
  ChatUserContextRow,
} from "@/types/database-augment";

/** What the AI SDK puts in chat_messages.content (parts array). */
export type ChatMessageContent = UIMessage["parts"];

/** Strongly-typed chat_messages row (content narrowed). */
export interface ChatMessage extends Omit<ChatMessageRow, "content"> {
  content: ChatMessageContent;
}

export type ChatThread = ChatThreadRow;
export type ChatUserContext = ChatUserContextRow;

/** Live storefront state the system prompt is augmented with each turn. */
export interface StorefrontState {
  locale: string;
  pathname: string;
  cart: { itemCount: number; totalCents: number; currency: string };
  bike: ChatUserContextRow["bike"];
  wishlistCount: number;
  ridingStyle: ChatUserContextRow["riding_style"];
  notes: string | null;
}

/** Locale codes the storefront supports (matches next-intl config). */
export type SiteLocale = "el" | "en" | "de" | "it" | "fr" | "bg";
