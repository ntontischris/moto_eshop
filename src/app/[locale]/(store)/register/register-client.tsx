"use client";

import { useState } from "react";
import { Link } from "@/i18n/navigation";
import { useSearchParams } from "next/navigation";
import { signUpWithEmail } from "@/lib/auth/actions";
import { AuthShell } from "../_components/auth/auth-shell";

export default function RegisterClient() {
  const sp = useSearchParams();
  const redirectTo = sp.get("redirectTo") || sp.get("next") || "/account";
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const fd = new FormData(e.currentTarget);
    try {
      const res = await signUpWithEmail(fd);
      if (res?.success) {
        setDone(true);
      } else {
        setError(res?.error ?? "Αποτυχία εγγραφής.");
        setBusy(false);
      }
    } catch {
      // possible server redirect — handled by Next
    }
  }

  if (done) {
    return (
      <AuthShell title="Σχεδόν έτοιμο" subtitle="Επιβεβαίωσε το email σου.">
        <p className="v3-auth-ok">
          Σου στείλαμε email επιβεβαίωσης. Άνοιξέ το για να ενεργοποιήσεις τον
          λογαριασμό σου και μετά συνδέσου.
        </p>
        <p className="v3-auth-alt">
          <Link href={`/login?redirectTo=${encodeURIComponent(redirectTo)}`}>
            Προς τη σύνδεση
          </Link>
        </p>
      </AuthShell>
    );
  }

  return (
    <AuthShell title="Εγγραφή" subtitle="Φτιάξε λογαριασμό MotoMarket.">
      <form className="v3-auth-form" onSubmit={onSubmit}>
        <label className="v3-auth-field">
          <span>Email</span>
          <input name="email" type="email" required autoComplete="email" />
        </label>
        <label className="v3-auth-field">
          <span>Κωδικός (8+, ένα κεφαλαίο, ένας αριθμός)</span>
          <input
            name="password"
            type="password"
            required
            autoComplete="new-password"
          />
        </label>
        <label className="v3-auth-terms">
          <input name="acceptedTerms" type="checkbox" value="true" required />
          <span>
            Αποδέχομαι τους όρους χρήσης &amp; την πολιτική απορρήτου.
          </span>
        </label>
        {error && <p className="v3-auth-err">{error}</p>}
        <button
          type="submit"
          className="v3-btn-primary v3-auth-submit"
          disabled={busy}
        >
          {busy ? "Εγγραφή…" : "Εγγραφή"}
        </button>
      </form>
      <p className="v3-auth-alt">
        Έχεις ήδη λογαριασμό;{" "}
        <Link href={`/login?redirectTo=${encodeURIComponent(redirectTo)}`}>
          Σύνδεση
        </Link>
      </p>
    </AuthShell>
  );
}
