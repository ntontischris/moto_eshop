"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { AuthFormWrapper } from "@/components/auth/auth-form-wrapper";
import { AuthErrorMessage } from "@/components/auth/auth-error-message";
import { PasswordInput } from "@/components/auth/password-input";
import { signUpWithEmail } from "@/lib/auth/actions";

export default function RegisterPage() {
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    const formData = new FormData(event.currentTarget);
    formData.set("acceptedTerms", acceptedTerms ? "true" : "false");

    startTransition(async () => {
      const result = await signUpWithEmail(formData);
      if (!result.success) {
        setError(result.error);
      } else {
        setIsSuccess(true);
      }
    });
  };

  if (isSuccess) {
    return (
      <AuthFormWrapper
        title="Επιβεβαίωση email"
        subtitle="Ελέγξτε τα εισερχόμενά σας"
      >
        <div className="space-y-4 py-4 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
            <svg
              className="h-8 w-8 text-green-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <p className="text-sm text-muted-foreground">
            Σας στείλαμε σύνδεσμο επιβεβαίωσης. Κάντε κλικ στον σύνδεσμο για να
            ενεργοποιήσετε τον λογαριασμό σας.
          </p>
          <p className="text-xs text-muted-foreground">
            Δεν λάβατε email;{" "}
            <button
              className="underline hover:text-foreground"
              onClick={() => setIsSuccess(false)}
            >
              Δοκιμάστε ξανά
            </button>
          </p>
        </div>
      </AuthFormWrapper>
    );
  }

  return (
    <AuthFormWrapper
      title="Δημιουργία λογαριασμού"
      subtitle="Εγγραφείτε δωρεάν στο MotoMarket"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
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
          label="Κωδικός (min. 8 χαρακτήρες)"
          autoComplete="new-password"
          placeholder="••••••••"
          required
          disabled={isPending}
        />

        <div className="flex items-start gap-3 pt-1">
          <Checkbox
            id="acceptedTerms"
            checked={acceptedTerms}
            onCheckedChange={(checked) => setAcceptedTerms(checked === true)}
            disabled={isPending}
          />
          <label
            htmlFor="acceptedTerms"
            className="text-sm leading-snug text-muted-foreground"
          >
            Αποδέχομαι τους{" "}
            <Link href="/terms" className="underline hover:text-foreground">
              Όρους Χρήσης
            </Link>{" "}
            και την{" "}
            <Link href="/privacy" className="underline hover:text-foreground">
              Πολιτική Απορρήτου
            </Link>
          </label>
        </div>

        <Button
          type="submit"
          className="w-full"
          disabled={isPending || !acceptedTerms}
        >
          {isPending ? "Εγγραφή..." : "Εγγραφή"}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Ήδη έχεις λογαριασμό;{" "}
        <Link
          href="/login"
          className="font-medium text-foreground hover:underline"
        >
          Σύνδεση
        </Link>
      </p>
    </AuthFormWrapper>
  );
}
