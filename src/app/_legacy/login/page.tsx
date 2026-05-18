"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AuthFormWrapper } from "@/components/auth/auth-form-wrapper";
import { AuthErrorMessage } from "@/components/auth/auth-error-message";
import { PasswordInput } from "@/components/auth/password-input";
import { signInWithEmail } from "@/lib/auth/actions";

const ERROR_MESSAGES: Record<string, string> = {
  oauth_failed: "Αποτυχία σύνδεσης με κοινωνικό δίκτυο. Δοκιμάστε ξανά.",
  missing_code: "Σφάλμα κατά την επιστροφή από τον πάροχο.",
  confirm_failed: "Ο σύνδεσμος επιβεβαίωσης δεν είναι έγκυρος.",
  invalid_token: "Μη έγκυρος σύνδεσμος. Δοκιμάστε ξανά.",
};

export default function LoginPage() {
  const searchParams = useSearchParams();
  const urlError = searchParams.get("error");

  const redirectTo = searchParams.get("next") ?? "/account";
  const [error, setError] = useState<string | null>(
    urlError ? (ERROR_MESSAGES[urlError] ?? "Προέκυψε σφάλμα.") : null,
  );
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    const formData = new FormData(event.currentTarget);

    startTransition(async () => {
      const result = await signInWithEmail(formData);
      if (!result.success) {
        setError(result.error);
      }
    });
  };

  return (
    <AuthFormWrapper title="Καλώς ήρθες" subtitle="Σύνδεση στον λογαριασμό σου">
      <form onSubmit={handleSubmit} className="space-y-4">
        <input type="hidden" name="redirectTo" value={redirectTo} />
        <AuthErrorMessage message={error} />

        <div className="space-y-1">
          <label
            htmlFor="email"
            className="text-sm font-medium text-foreground"
          >
            Email
          </label>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            required
            disabled={isPending}
          />
        </div>

        <PasswordInput
          id="password"
          name="password"
          autoComplete="current-password"
          placeholder="••••••••"
          required
          disabled={isPending}
        />

        <div className="flex justify-end">
          <Link
            href="/forgot-password"
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            Ξέχασες τον κωδικό;
          </Link>
        </div>

        <Button type="submit" className="w-full" disabled={isPending}>
          {isPending ? "Σύνδεση..." : "Σύνδεση"}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Δεν έχεις λογαριασμό;{" "}
        <Link
          href="/register"
          className="font-medium text-foreground hover:underline"
        >
          Δημιούργησε τώρα
        </Link>
      </p>
    </AuthFormWrapper>
  );
}
