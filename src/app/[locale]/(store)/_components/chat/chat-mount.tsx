"use client";

import { ChatProvider } from "./chat-provider";
import { ChatLauncher } from "./chat-launcher";

/**
 * Single mount point for the chat island.
 *
 * Lives inside a <Suspense> boundary in the storefront layout so that
 * Next.js 16's cacheComponents prerender accepts the non-deterministic
 * IDs that `useChat` generates internally (via Math.random).
 *
 * The ChatProvider does NOT wrap the storefront children — nothing in
 * the storefront tree consumes useChatContext outside this island.
 */
export function ChatMount() {
  return (
    <ChatProvider>
      <ChatLauncher />
    </ChatProvider>
  );
}
