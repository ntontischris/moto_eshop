"use client";

import { useState } from "react";
import { Link } from "@/i18n/navigation";
import { useSearchParams } from "next/navigation";
import { useRouter } from "@/i18n/navigation";
import { signInWithEmail } from "@/lib/auth/actions";
import { AuthShell } from "../_components/auth/auth-shell";

export default function LoginClient() {
  const router = useRouter();
  const sp = useSearchParams();
  const redirectTo = sp.get("redirectTo") || sp.get("next") || "/account";
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const fd = new FormData(e.currentTarget);
    fd.set("redirectTo", redirectTo);
    try {
      const res = await signInWithEmail(fd);
      if (res?.success) {
        router.push(redirectTo);
        router.refresh();
      } else {
        setError(res?.error ?? "Αποτυχία σύνδεσης.");
        setBusy(false);
      }
    } catch {
      // server action performed a redirect — navigation handled by Next
    }
  }

  return (
    <AuthShell title="Σύνδεση" subtitle="Καλώς ήρθες πίσω.">
      <form className="v3-auth-form" onSubmit={onSubmit}>
        <label className="v3-auth-field">
          <span>Email</span>
          <input name="email" type="email" required autoComplete="email" />
        </label>
        <label className="v3-auth-field">
          <span>Κωδικός</span>
          <input
            name="password"
            type="password"
            required
            autoComplete="current-password"
          />
        </label>
        {error && <p className="v3-auth-err">{error}</p>}
        <button
          type="submit"
          className="v3-btn-primary v3-auth-submit"
          disabled={busy}
        >
          {busy ? "Σύνδεση…" : "Σύνδεση"}
        </button>
      </form>
      <p className="v3-auth-alt">
        Δεν έχεις λογαριασμό;{" "}
        <Link href={`/register?redirectTo=${encodeURIComponent(redirectTo)}`}>
          Εγγραφή
        </Link>
      </p>
    </AuthShell>
  );
}
