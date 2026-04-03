import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

/**
 * Public anon client — no cookies, no auth session.
 * Safe to use inside 'use cache' functions where cookies() is not allowed.
 * Relies on RLS public read policies for data access.
 */
export const createPublicClient = () =>
  createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  );
