"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AuthFormWrapper } from "@/components/auth/auth-form-wrapper";
import { AuthErrorMessage } from "@/components/auth/auth-error-message";
import { resetPassword } from "@/lib/auth/actions";

export default function ForgotPasswordPage() {
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    const formData = new FormData(event.currentTarget);

    startTransition(async () => {
      const result = await resetPassword(formData);
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
        title="Email στάλθηκε"
        subtitle="Ελέγξτε τα εισερχόμενά σας"
      >
        <div className="space-y-4 py-4 text-center">
          <p className="text-sm text-muted-foreground">
            Στείλαμε οδηγίες επαναφοράς κωδικού στο email σας. Ο σύνδεσμος
            ισχύει για 60 λεπτά.
          </p>
          <Link
            href="/login"
            className="text-sm font-medium text-foreground hover:underline"
          >
            Επιστροφή στη σύνδεση
          </Link>
        </div>
      </AuthFormWrapper>
    );
  }

  return (
    <AuthFormWrapper
      title="Επαναφορά κωδικού"
      subtitle="Εισάγετε το email σας για να λάβετε οδηγίες"
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

        <Button type="submit" className="w-full" disabled={isPending}>
          {isPending ? "Αποστολή..." : "Αποστολή οδηγιών"}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Θυμήθηκες τον κωδικό;{" "}
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
