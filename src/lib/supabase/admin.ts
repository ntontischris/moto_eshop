import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

/**
 * Service-role client — bypasses RLS.
 * Use ONLY in:
 *   - ERP sync Edge Functions
 *   - Trusted server-side automation jobs
 *   - Webhook handlers after signature verification
 * NEVER expose to client code.
 */
export const createAdminClient = () =>
  createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  );
