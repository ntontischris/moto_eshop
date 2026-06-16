import { ChatDeferredMount } from "./chat-deferred-mount";

/**
 * Server gateway for the chat island.
 *
 * Renders the deferred client island `<ChatDeferredMount />` ONLY when the
 * runtime is configured to talk to OpenAI. When `OPENAI_API_KEY` is missing in
 * the env (e.g. the Vercel project hasn't been wired up yet) we render nothing
 * at all — that way the chat client never mounts, never opens a stream, and a
 * chat-stream failure can't bubble up to the global `error.tsx` boundary and
 * break storefront navigation.
 *
 * `ChatDeferredMount` keeps the heavy @ai-sdk/react + ai bundle off the initial
 * JS chunk via next/dynamic (see ADR 0008); this server gateway stays purely
 * responsible for the env gate so a missing key ships zero chat code.
 *
 * To turn the chat ON in production: set `OPENAI_API_KEY` in Vercel env vars
 * (Production scope) and redeploy. To explicitly force it OFF without
 * removing the key, set `CHAT_DISABLED=1`.
 */
export function ChatMount() {
  const hasOpenAIKey = Boolean(process.env.OPENAI_API_KEY);
  const explicitlyDisabled = process.env.CHAT_DISABLED === "1";
  if (!hasOpenAIKey || explicitlyDisabled) return null;
  return <ChatDeferredMount />;
}
