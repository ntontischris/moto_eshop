"use client";

import { ChatProvider } from "./chat-provider";
import { ChatLauncher } from "./chat-launcher";

/**
 * Client island for the chat. Mounted by the server `<ChatMount />` only when
 * the runtime is properly configured (see chat-mount.tsx).
 */
export function ChatMountClient() {
  return (
    <ChatProvider>
      <ChatLauncher />
    </ChatProvider>
  );
}
