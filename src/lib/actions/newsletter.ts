"use server";

import { createAdminClient } from "@/lib/supabase/admin";

export interface SubscribeResult {
  ok: boolean;
  message: string;
}

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

/**
 * Add an email to the newsletter list. Fails gracefully if the table is
 * missing (so the homepage never breaks before the migration is applied).
 */
export async function subscribeToNewsletter(
  email: string,
  source = "home",
): Promise<SubscribeResult> {
  const clean = email.trim().toLowerCase();
  if (!EMAIL_RE.test(clean)) {
    return { ok: false, message: "Μη έγκυρο email." };
  }

  try {
    const supabase = createAdminClient();
    const { error } = await supabase
      .from("newsletter_subscribers")
      .insert({ email: clean, source });

    if (error) {
      // unique violation → already subscribed; treat as success
      if (error.code === "23505") {
        return { ok: true, message: "Είσαι ήδη στη λίστα — τα λέμε σύντομα!" };
      }
      console.error("newsletter subscribe failed:", error.message);
      return { ok: false, message: "Κάτι πήγε στραβά. Δοκίμασε ξανά." };
    }

    return { ok: true, message: "Καλώς ήρθες στην ομάδα! 🏁" };
  } catch (e) {
    console.error("newsletter subscribe exception:", e);
    return { ok: false, message: "Κάτι πήγε στραβά. Δοκίμασε ξανά." };
  }
}
