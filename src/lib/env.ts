import { z } from "zod/v4";

const envSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),

  // ERP integration (Entersoft today, Odoo later)
  ERP_PROVIDER: z.enum(["entersoft", "odoo"]).default("entersoft"),
  ENTERSOFT_API_KEY: z.string().min(1).optional(),
  ENTERSOFT_API_URL: z
    .url()
    .default("https://api.entersoft.gr/api/rpc/PublicQuery/ESWBCat"),

  // Cron secret — required to hit /api/cron/* endpoints
  CRON_SECRET: z.string().min(16).optional(),

  // AI sales chat
  OPENAI_API_KEY: z.string().min(20),
  UPSTASH_REDIS_REST_URL: z.url().optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().min(1).optional(),
  RESEND_API_KEY: z.string().min(1).optional(),
  CHAT_HANDOFF_TO: z.email().default("sales@motomarket-shop.gr"),
  CHAT_DAILY_USD_CAP: z.coerce.number().positive().default(20),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error(
    "Invalid environment variables:",
    parsed.error.flatten().fieldErrors,
  );
  throw new Error("Invalid environment variables — check .env.local");
}

export const env = parsed.data;
