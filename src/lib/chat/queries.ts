import { createClient } from "@/lib/supabase/server";
import type { ChatMessage, ChatMessageContent } from "./types";
import type { ChatRole } from "@/types/database-augment";

export const RECENT_MESSAGE_WINDOW = 30;

/**
 * Sets the Postgres session GUC used by RLS policies to scope anonymous queries.
 * Call this at the top of any chat-related query path BEFORE other selects.
 */
export async function setSessionGuc(sessionId: string): Promise<void> {
  const supabase = await createClient();
  // chat tables are not in generated DB types — cast through any (project pattern)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;
  await db.rpc("set_config", {
    parameter: "app.session_id",
    value: sessionId,
    is_local: true,
  });
}

/** Last RECENT_MESSAGE_WINDOW messages in chronological (oldest-first) order. */
export async function loadRecentMessages(
  threadId: string,
): Promise<ChatMessage[]> {
  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;
  const { data, error } = await db
    .from("chat_messages")
    .select("id, thread_id, role, content, audio_url, tool_calls, created_at")
    .eq("thread_id", threadId)
    .order("created_at", { ascending: true })
    .limit(RECENT_MESSAGE_WINDOW);
  if (error || !data) return [];

  return data as Array<{
    id: string;
    thread_id: string;
    role: ChatRole;
    content: ChatMessageContent;
    audio_url: string | null;
    tool_calls: unknown | null;
    created_at: string;
  }>;
}

export interface CreateThreadInput {
  userId: string | null;
  sessionId: string;
  locale: string;
}

export async function createThread(input: CreateThreadInput): Promise<string> {
  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;
  const { data, error } = await db
    .from("chat_threads")
    .insert({
      user_id: input.userId,
      session_id: input.sessionId,
      locale: input.locale,
    })
    .select("id")
    .single();
  if (error || !data) {
    throw new Error(
      `createThread failed: ${(error as { message: string } | null)?.message ?? "no row"}`,
    );
  }
  return (data as { id: string }).id;
}

export interface AppendMessageInput {
  threadId: string;
  role: ChatRole;
  content: ChatMessageContent;
  toolCalls?: unknown;
}

export async function appendMessage(input: AppendMessageInput): Promise<void> {
  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;
  const { error } = await db.from("chat_messages").insert({
    thread_id: input.threadId,
    role: input.role,
    content: input.content,
    tool_calls: input.toolCalls ?? null,
  });
  if (error)
    throw new Error(
      `appendMessage failed: ${(error as { message: string }).message}`,
    );

  await db
    .from("chat_threads")
    .update({ last_message_at: new Date().toISOString() })
    .eq("id", input.threadId);
}
