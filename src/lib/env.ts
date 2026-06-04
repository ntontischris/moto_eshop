import { z } from "zod/v4";

/**
 * Single source of validated environment config. Core vars are required and the
 * app cannot run without them; everything else is feature-gated and optional so
 * its absence degrades one feature instead of crashing the app. Parsed once at
 * module load via `env`; import that, never `process.env`, in app code.
 *
 * NOTE: this file pre-dates Track C. It previously required OPENAI_API_KEY,
 * which would crash the whole app whenever the AI chat was unconfigured. The
 * chat is feature-gated, so OPENAI_API_KEY is now optional. Existing keys are
 * preserved (ERP/cron/handoff/cap) so no config knowledge is lost.
 */
export const envSchema = z.object({
  // --- Required core (app cannot function without these) ---
  NEXT_PUBLIC_SUPABASE_URL: z.url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  NEXT_PUBLIC_SITE_URL: z.url(),

  // --- Optional: ERP (Entersoft today, Odoo later) ---
  ERP_PROVIDER: z.enum(["entersoft", "odoo"]).default("entersoft"),
  ENTERSOFT_API_KEY: z.string().optional(),
  ENTERSOFT_API_URL: z
    .url()
    .default("https://api.entersoft.gr/api/rpc/PublicQuery/ESWBCat"),

  // --- Optional: search (Meilisearch) ---
  MEILI_HOST: z.url().optional(),
  NEXT_PUBLIC_MEILI_HOST: z.url().optional(),
  MEILI_ADMIN_KEY: z.string().optional(),
  NEXT_PUBLIC_MEILI_SEARCH_KEY: z.string().optional(),

  // --- Optional: rate limiting (Upstash) ---
  UPSTASH_REDIS_REST_URL: z.url().optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().optional(),

  // --- Optional: AI assistant / campaigns ---
  OPENAI_API_KEY: z.string().optional(),
  ANTHROPIC_API_KEY: z.string().optional(),
  OPENAI_MODEL: z.string().optional(),
  ANTHROPIC_MODEL: z.string().optional(),
  CHAT_DISABLED: z.string().optional(),
  CHAT_DAILY_USD_CAP: z.coerce.number().positive().default(20),

  // --- Optional: transactional email (Resend) + handoff ---
  RESEND_API_KEY: z.string().optional(),
  CHAT_HANDOFF_TO: z.email().default("sales@motomarket-shop.gr"),
  CHAT_FROM_EMAIL: z.string().optional(),

  // --- Optional: admin + cron + observability ---
  CRON_SECRET: z.string().min(16).optional(),
  ADMIN_API_SECRET: z.string().optional(),
  SENTRY_DSN: z.string().optional(),
});

export type Env = z.infer<typeof envSchema>;

function parseEnv(): Env {
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    const missing = parsed.error.issues
      .map((i) => `  - ${i.path.join(".")}: ${i.message}`)
      .join("\n");
    throw new Error(
      `Invalid environment configuration:\n${missing}\n` +
        `Set the variables above (see .env.example) and restart.`,
    );
  }
  return parsed.data;
}

/**
 * Validate `process.env` against the schema. Call this explicitly (e.g. at
 * server startup) when you want validation to run eagerly. Memoised.
 */
let cached: Env | undefined;
export function loadEnv(): Env {
  return (cached ??= parseEnv());
}

/**
 * Validated environment, accessed ergonomically as `env.NEXT_PUBLIC_SITE_URL`.
 * Validation is **lazy**: importing this module has no side effect (so it is
 * unit-testable and safe to import anywhere), but the first property access
 * validates and throws the aggregated error if a core var is missing — still
 * fail-fast at the first real use.
 */
export const env: Env = new Proxy({} as Env, {
  get: (_t, prop: string) => loadEnv()[prop as keyof Env],
});
