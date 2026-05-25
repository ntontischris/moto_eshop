"use client";

import { useState } from "react";
import { Link } from "@/i18n/navigation";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { signUpWithEmail } from "@/lib/auth/actions";
import { AuthShell } from "../_components/auth/auth-shell";

export default function RegisterClient() {
  const t = useTranslations("auth");
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
        setError(res?.error ?? t("registerError"));
        setBusy(false);
      }
    } catch {
      // possible server redirect — handled by Next
    }
  }

  if (done) {
    return (
      <AuthShell title={t("confirmTitle")} subtitle={t("confirmSubtitle")}>
        <p className="v3-auth-ok">{t("confirmText")}</p>
        <p className="v3-auth-alt">
          <Link href={`/login?redirectTo=${encodeURIComponent(redirectTo)}`}>
            {t("toLogin")}
          </Link>
        </p>
      </AuthShell>
    );
  }

  return (
    <AuthShell title={t("registerTitle")} subtitle={t("registerSubtitle")}>
      <form className="v3-auth-form" onSubmit={onSubmit}>
        <label className="v3-auth-field">
          <span>Email</span>
          <input name="email" type="email" required autoComplete="email" />
        </label>
        <label className="v3-auth-field">
          <span>{t("passwordHint")}</span>
          <input
            name="password"
            type="password"
            required
            autoComplete="new-password"
          />
        </label>
        <label className="v3-auth-terms">
          <input name="acceptedTerms" type="checkbox" value="true" required />
          <span>{t("acceptTerms")}</span>
        </label>
        {error && <p className="v3-auth-err">{error}</p>}
        <button
          type="submit"
          className="v3-btn-primary v3-auth-submit"
          disabled={busy}
        >
          {busy ? t("registerBusy") : t("registerButton")}
        </button>
      </form>
      <p className="v3-auth-alt">
        {t("hasAccount")}{" "}
        <Link href={`/login?redirectTo=${encodeURIComponent(redirectTo)}`}>
          {t("loginLink")}
        </Link>
      </p>
    </AuthShell>
  );
}
