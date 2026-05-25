import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";

export type AiProvider = "claude" | "openai";

export function providerAvailable(provider: AiProvider): boolean {
  return provider === "claude"
    ? Boolean(process.env.ANTHROPIC_API_KEY)
    : Boolean(process.env.OPENAI_API_KEY);
}

export function providerLabel(provider: AiProvider): string {
  return provider === "claude" ? "Claude" : "ChatGPT";
}

/**
 * Provider-agnostic text generation. Both paths return the raw model reply
 * (expected to contain JSON); validation is done downstream by `repair`, so
 * adding a provider never touches the safety net.
 */
export async function generateText(opts: {
  provider: AiProvider;
  system: string;
  user: string;
  maxTokens?: number;
}): Promise<string> {
  const maxTokens = opts.maxTokens ?? 8000;

  if (opts.provider === "openai") {
    const client = new OpenAI();
    const res = await client.chat.completions.create({
      model: process.env.OPENAI_MODEL ?? "gpt-4o",
      max_completion_tokens: maxTokens,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: opts.system },
        { role: "user", content: opts.user },
      ],
    });
    return res.choices[0]?.message?.content ?? "";
  }

  const client = new Anthropic();
  const msg = await client.messages.create({
    model: process.env.ANTHROPIC_MODEL ?? "claude-sonnet-4-6",
    max_tokens: maxTokens,
    system: [
      {
        type: "text",
        text: opts.system,
        cache_control: { type: "ephemeral" },
      },
    ],
    messages: [{ role: "user", content: opts.user }],
  });
  return msg.content.map((b) => (b.type === "text" ? b.text : "")).join("");
}
