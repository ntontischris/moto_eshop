// Hand-written type augmentation for chat tables.
// Do NOT replace by running `pnpm db:types` — that regenerates database.ts and
// drops other manual edits. When the chat tables change, edit THIS file.

export type ChatRole = "user" | "assistant" | "tool" | "system";

export interface ChatThreadRow {
  id: string;
  user_id: string | null;
  session_id: string;
  locale: string;
  title: string | null;
  last_message_at: string;
  created_at: string;
  archived: boolean;
}

export interface ChatMessageRow {
  id: string;
  thread_id: string;
  role: ChatRole;
  content: unknown; // jsonb — concrete shape lives in lib/chat/types.ts
  audio_url: string | null;
  tool_calls: unknown | null;
  created_at: string;
}

export interface ChatUserContextRow {
  id: string;
  user_id: string | null;
  session_id: string | null;
  bike: { brand?: string; model?: string; year?: number; cc?: number } | null;
  riding_style: "touring" | "sport" | "adventure" | "urban" | "offroad" | null;
  size_profile: {
    helmet?: string;
    jacket?: string;
    gloves?: string;
    boots?: string;
  } | null;
  preferred_brands: string[] | null;
  budget_band: "entry" | "mid" | "premium" | null;
  notes: string | null;
  updated_at: string;
}

export interface ChatTelemetryRow {
  id: string;
  thread_id: string | null;
  message_id: string | null;
  event: string;
  model: string | null;
  prompt_tokens: number | null;
  completion_tokens: number | null;
  tool_name: string | null;
  tool_status: string | null;
  cost_usd: number | null;
  latency_ms: number | null;
  session_id: string | null;
  user_id: string | null;
  created_at: string;
}
