/**
 * Engine-agnostic translation interface plus a Claude adapter.
 *
 * No top-level side effects: importing this module does not read any
 * environment variable or open a network connection. The API key is only
 * consumed when {@link createClaudeEngine} is called.
 */

import Anthropic from "@anthropic-ai/sdk";

export type FieldKind = "name" | "description" | "meta";

export interface TranslateRequest {
  /** Already glossary-masked source strings (Greek). */
  texts: string[];
  /** Target locale code, e.g. "en". */
  targetLocale: string;
  kind: FieldKind;
}

export interface TranslateEngine {
  name: string;
  translate(req: TranslateRequest): Promise<string[]>;
}

/** Cheap bulk model for descriptions; quality model for SEO-critical fields. */
const MODEL_DESCRIPTION = "claude-haiku-4-5-20251001";
const MODEL_QUALITY = "claude-sonnet-4-6";

const modelForKind = (kind: FieldKind): string =>
  kind === "description" ? MODEL_DESCRIPTION : MODEL_QUALITY;

const systemPrompt = (targetLocale: string, kind: FieldKind): string =>
  `You are a professional e-commerce translator for a motorcycle-gear shop. ` +
  `Translate from Greek to ${targetLocale}. ` +
  `Preserve placeholder tokens of the form ⟦n⟧ EXACTLY (do not translate or alter them). ` +
  `Keep it concise and natural for product ${kind}. ` +
  `Return ONLY a JSON array of strings, same length and order as the input, no extra text.`;

/** Concatenate all text blocks of an assistant message into one string. */
function extractText(message: Anthropic.Message): string {
  return message.content
    .filter((block): block is Anthropic.TextBlock => block.type === "text")
    .map((block) => block.text)
    .join("");
}

/** Parse a JSON array of strings, tolerating fenced code blocks. */
function parseStringArray(raw: string): string[] {
  const trimmed = raw
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/```$/, "");
  const start = trimmed.indexOf("[");
  const end = trimmed.lastIndexOf("]");
  if (start === -1 || end === -1 || end < start) {
    throw new Error(
      `Engine response is not a JSON array: ${raw.slice(0, 200)}`,
    );
  }
  const parsed: unknown = JSON.parse(trimmed.slice(start, end + 1));
  if (!Array.isArray(parsed) || !parsed.every((x) => typeof x === "string")) {
    throw new Error("Engine response is not an array of strings");
  }
  return parsed;
}

export function createClaudeEngine(apiKey: string): TranslateEngine {
  const client = new Anthropic({ apiKey });

  return {
    name: "claude",
    async translate({ texts, targetLocale, kind }): Promise<string[]> {
      if (texts.length === 0) return [];

      const message = await client.messages.create({
        model: modelForKind(kind),
        max_tokens: 4096,
        temperature: 0,
        system: [
          {
            type: "text",
            text: systemPrompt(targetLocale, kind),
            cache_control: { type: "ephemeral" },
          },
        ],
        messages: [{ role: "user", content: JSON.stringify(texts) }],
      });

      const result = parseStringArray(extractText(message));
      if (result.length !== texts.length) {
        throw new Error(
          `Engine returned ${result.length} items, expected ${texts.length}`,
        );
      }
      return result;
    },
  };
}
