import { openai } from "@ai-sdk/openai";
import { streamText, convertToModelMessages } from "ai";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { createClient } from "@/lib/supabase/server";
import {
  SESSION_COOKIE_NAME,
  SESSION_COOKIE_OPTIONS,
  generateSessionId,
  isValidSessionId,
} from "@/lib/chat/session";
import { checkRateLimit } from "@/lib/chat/rate-limit";
import {
  setSessionGuc,
  createThread,
  appendMessage,
  loadRecentMessages,
} from "@/lib/chat/queries";
import { loadStorefrontState } from "@/lib/chat/storefront-state";
import { buildSystemPrompt } from "@/lib/chat/prompts/build-system-prompt";
import { chatTools } from "@/lib/chat/tools";

export const runtime = "nodejs";
export const maxDuration = 30;

const bodySchema = z.object({
  messages: z.array(z.unknown()),
  threadId: z.string().uuid().nullable().optional(),
  locale: z.string().min(2).max(5).default("el"),
  pathname: z.string().default("/"),
  cartItemCount: z.number().int().nonnegative().default(0),
  cartTotalCents: z.number().int().nonnegative().default(0),
  currency: z.string().default("EUR"),
});

export async function POST(req: NextRequest): Promise<Response> {
  // --- Parse + validate body ---
  let body: z.infer<typeof bodySchema>;
  try {
    const raw = await req.json();
    body = bodySchema.parse(raw);
  } catch {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 },
    );
  }

  const {
    messages,
    threadId,
    locale,
    pathname,
    cartItemCount,
    cartTotalCents,
    currency,
  } = body;

  // --- Resolve or generate session cookie ---
  const cookieStore = await cookies();
  const existingCookie = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  const sessionId =
    existingCookie && isValidSessionId(existingCookie)
      ? existingCookie
      : generateSessionId();

  const isNewSession = sessionId !== existingCookie;

  // --- Auth ---
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const userId = user?.id ?? null;
  const isAnonymous = userId === null;

  // --- Rate limit ---
  const rateLimitKey = isAnonymous ? `anon:${sessionId}` : `user:${userId}`;
  const rl = await checkRateLimit({ key: rateLimitKey, isAnonymous });
  if (!rl.ok) {
    const resp = NextResponse.json(
      {
        error:
          "Έχεις υπερβεί το όριο μηνυμάτων. Παρακαλώ δοκίμασε ξανά σε λίγο.",
      },
      { status: 429 },
    );
    if (isNewSession) {
      resp.cookies.set(SESSION_COOKIE_NAME, sessionId, SESSION_COOKIE_OPTIONS);
    }
    return resp;
  }

  // --- DB: session GUC, thread, persist user message ---
  // All DB work is wrapped in try/catch so streaming never blocks on DB errors.
  let resolvedThreadId: string | null = threadId ?? null;

  try {
    await setSessionGuc(sessionId);

    if (!resolvedThreadId) {
      resolvedThreadId = await createThread({ userId, sessionId, locale });
    }

    const lastMessage = messages[messages.length - 1] as
      | { role?: string; parts?: unknown[] }
      | undefined;
    if (lastMessage && lastMessage.role === "user") {
      await appendMessage({
        threadId: resolvedThreadId,
        role: "user",
        content: (lastMessage.parts ?? []) as import("ai").UIMessage["parts"],
      });
    }
  } catch (err) {
    console.error("[chat/route] DB persistence error (non-fatal):", err);
    // Continue — streaming works without DB
  }

  // --- Load conversation history from DB (best-effort) ---
  let historyMessages: Awaited<ReturnType<typeof loadRecentMessages>> = [];
  if (resolvedThreadId) {
    try {
      historyMessages = await loadRecentMessages(resolvedThreadId);
    } catch (err) {
      console.error("[chat/route] loadRecentMessages error (non-fatal):", err);
    }
  }

  // Build model messages: prefer DB history (authoritative) if available,
  // otherwise fall back to client-supplied messages array.
  const rawForConversion =
    historyMessages.length > 0
      ? historyMessages.map((m) => ({
          role: m.role as "user" | "assistant",
          parts: m.content,
        }))
      : (messages as Array<{ role: string; parts?: unknown[] }>).map((m) => ({
          role: m.role as "user" | "assistant",
          parts: (m.parts ?? []) as import("ai").UIMessage["parts"],
        }));

  const modelMessages = await convertToModelMessages(rawForConversion);

  // --- System prompt ---
  let systemPrompt: string;
  try {
    const storefrontState = await loadStorefrontState({
      locale,
      pathname,
      userId,
      sessionId,
      cartItemCount,
      cartTotalCents,
      currency,
    });
    systemPrompt = buildSystemPrompt(storefrontState);
  } catch (err) {
    console.error("[chat/route] loadStorefrontState error (non-fatal):", err);
    systemPrompt = buildSystemPrompt({
      locale,
      pathname,
      cart: { itemCount: cartItemCount, totalCents: cartTotalCents, currency },
      bike: null,
      wishlistCount: 0,
      ridingStyle: null,
      notes: null,
    });
  }

  // --- Stream ---
  const result = streamText({
    model: openai("gpt-4o"),
    system: systemPrompt,
    messages: modelMessages,
    tools: chatTools,
    temperature: 0.3,
    maxOutputTokens: 800,
    onFinish: async ({ text }) => {
      if (!resolvedThreadId) return;
      try {
        await appendMessage({
          threadId: resolvedThreadId,
          role: "assistant",
          content: [{ type: "text", text }],
        });
      } catch (err) {
        console.error(
          "[chat/route] assistant appendMessage error (non-fatal):",
          err,
        );
      }
    },
  });

  const responseHeaders: Record<string, string> = {
    ...(resolvedThreadId ? { "x-thread-id": resolvedThreadId } : {}),
  };

  const response = result.toUIMessageStreamResponse({
    headers: responseHeaders,
  });

  // Set session cookie on new sessions
  if (isNewSession) {
    response.headers.set(
      "Set-Cookie",
      `${SESSION_COOKIE_NAME}=${sessionId}; Path=${SESSION_COOKIE_OPTIONS.path}; Max-Age=${SESSION_COOKIE_OPTIONS.maxAge}; SameSite=${SESSION_COOKIE_OPTIONS.sameSite}; HttpOnly${SESSION_COOKIE_OPTIONS.secure ? "; Secure" : ""}`,
    );
  }

  return response;
}
