"use client";

import { useState } from "react";
import { ArrowRight, Check } from "lucide-react";
import { useTranslations } from "next-intl";
import { subscribeToNewsletter } from "@/lib/actions/newsletter";

type State = "idle" | "loading" | "done" | "error";

export function NewsletterBand() {
  const t = useTranslations("home");
  const [email, setEmail] = useState("");
  const [state, setState] = useState<State>("idle");
  const [message, setMessage] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (state === "loading") return;
    setState("loading");
    const res = await subscribeToNewsletter(email, "home");
    setMessage(res.message);
    setState(res.ok ? "done" : "error");
  }

  return (
    <section className="v3-nl" aria-label="Newsletter">
      <div className="v3-nl-inner">
        <p className="v3-label">{t("newsletterKicker")}</p>
        <h2 className="v3-display v3-nl-title">{t("newsletterTitle")}</h2>
        <p className="v3-nl-sub">{t("newsletterSub")}</p>

        {state === "done" ? (
          <p className="v3-nl-done" role="status">
            <Check size={18} aria-hidden="true" />
            {message}
          </p>
        ) : (
          <form className="v3-nl-form" onSubmit={handleSubmit} noValidate>
            <div className="v3-nl-capsule" data-error={state === "error"}>
              <input
                type="email"
                inputMode="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t("newsletterEmailPlaceholder")}
                aria-label={t("newsletterEmailLabel")}
                disabled={state === "loading"}
              />
              <button
                type="submit"
                aria-label={t("newsletterSubmit")}
                disabled={state === "loading"}
              >
                <ArrowRight size={18} aria-hidden="true" />
              </button>
            </div>
            <span
              className="v3-nl-fine"
              role={state === "error" ? "alert" : undefined}
            >
              {state === "error" ? message : t("newsletterFine")}
            </span>
          </form>
        )}
      </div>
    </section>
  );
}
