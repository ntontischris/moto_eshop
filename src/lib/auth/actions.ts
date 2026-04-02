"use server";

import { redirect } from "next/navigation";
import { z } from "zod/v4";
import { createClient } from "@/lib/supabase/server";

const signInSchema = z.object({
  email: z.email("Εισάγετε έγκυρο email"),
  password: z.string().min(1, "Απαιτείται κωδικός"),
});

const signUpSchema = z.object({
  email: z.email("Εισάγετε έγκυρο email"),
  password: z
    .string()
    .min(8, "Τουλάχιστον 8 χαρακτήρες")
    .regex(/[A-Z]/, "Απαιτείται ένα κεφαλαίο γράμμα")
    .regex(/[0-9]/, "Απαιτείται ένας αριθμός"),
  acceptedTerms: z.literal(true, {
    error: "Αποδεχτείτε τους όρους χρήσης",
  }),
});

const resetPasswordSchema = z.object({
  email: z.email("Εισάγετε έγκυρο email"),
});

const updatePasswordSchema = z.object({
  password: z
    .string()
    .min(8, "Τουλάχιστον 8 χαρακτήρες")
    .regex(/[A-Z]/, "Απαιτείται ένα κεφαλαίο γράμμα")
    .regex(/[0-9]/, "Απαιτείται ένας αριθμός"),
});

const oauthProviderSchema = z.enum(["google", "facebook", "apple"]);

export type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string };

export type OAuthProvider = z.infer<typeof oauthProviderSchema>;

export async function signInWithEmail(
  formData: FormData,
): Promise<ActionResult> {
  const raw = {
    email: formData.get("email"),
    password: formData.get("password"),
  };

  const parsed = signInSchema.safeParse(raw);
  if (!parsed.success) {
    const firstError = parsed.error.issues[0]?.message ?? "Σφάλμα επικύρωσης";
    return { success: false, error: firstError };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });

  if (error) {
    if (error.message.includes("Invalid login credentials")) {
      return { success: false, error: "Λάθος email ή κωδικός" };
    }
    if (error.message.includes("Email not confirmed")) {
      return {
        success: false,
        error: "Επιβεβαιώστε το email σας πριν συνδεθείτε",
      };
    }
    return { success: false, error: "Αποτυχία σύνδεσης. Δοκιμάστε ξανά." };
  }

  redirect("/account");
}

export async function signUpWithEmail(
  formData: FormData,
): Promise<ActionResult> {
  const raw = {
    email: formData.get("email"),
    password: formData.get("password"),
    acceptedTerms: formData.get("acceptedTerms") === "true" ? true : undefined,
  };

  const parsed = signUpSchema.safeParse(raw);
  if (!parsed.success) {
    const firstError = parsed.error.issues[0]?.message ?? "Σφάλμα επικύρωσης";
    return { success: false, error: firstError };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/confirm`,
    },
  });

  if (error) {
    if (error.message.includes("User already registered")) {
      return {
        success: false,
        error: "Υπάρχει ήδη λογαριασμός με αυτό το email",
      };
    }
    return { success: false, error: "Αποτυχία εγγραφής. Δοκιμάστε ξανά." };
  }

  return { success: true, data: undefined };
}

export async function signInWithOAuth(
  provider: OAuthProvider,
): Promise<ActionResult<{ url: string }>> {
  const parsed = oauthProviderSchema.safeParse(provider);
  if (!parsed.success) {
    return { success: false, error: "Μη έγκυρος πάροχος" };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: parsed.data,
    options: {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
      queryParams: { access_type: "offline", prompt: "consent" },
    },
  });

  if (error || !data.url) {
    return { success: false, error: "Αποτυχία σύνδεσης με κοινωνικό δίκτυο" };
  }

  return { success: true, data: { url: data.url } };
}

export async function signOut(): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase.auth.signOut();

  if (error) {
    return { success: false, error: "Αποτυχία αποσύνδεσης" };
  }

  redirect("/");
}

export async function resetPassword(formData: FormData): Promise<ActionResult> {
  const raw = { email: formData.get("email") };
  const parsed = resetPasswordSchema.safeParse(raw);

  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Σφάλμα επικύρωσης",
    };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(
    parsed.data.email,
    {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/confirm?type=recovery`,
    },
  );

  if (error) {
    return { success: false, error: "Αποτυχία αποστολής email επαναφοράς" };
  }

  return { success: true, data: undefined };
}

export async function updatePassword(
  formData: FormData,
): Promise<ActionResult> {
  const raw = { password: formData.get("password") };
  const parsed = updatePasswordSchema.safeParse(raw);

  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Σφάλμα επικύρωσης",
    };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({
    password: parsed.data.password,
  });

  if (error) {
    return { success: false, error: "Αποτυχία ενημέρωσης κωδικού" };
  }

  redirect("/account");
}
