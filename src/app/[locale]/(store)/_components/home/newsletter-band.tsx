"use client";

import { useState } from "react";
import { ArrowRight, Check } from "lucide-react";
import { subscribeToNewsletter } from "@/lib/actions/newsletter";

type State = "idle" | "loading" | "done" | "error";

export function NewsletterBand() {
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
        <p className="v3-label">Μπες στο pit-lane</p>
        <h2 className="v3-display v3-nl-title">
          −10% στην πρώτη σου παραγγελία.
        </h2>
        <p className="v3-nl-sub">
          Νέες παραλαβές & προσφορές — πρώτος στη γραμμή εκκίνησης.
        </p>

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
                placeholder="Το email σου"
                aria-label="Το email σου"
                disabled={state === "loading"}
              />
              <button
                type="submit"
                aria-label="Εγγραφή"
                disabled={state === "loading"}
              >
                <ArrowRight size={18} aria-hidden="true" />
              </button>
            </div>
            <span
              className="v3-nl-fine"
              role={state === "error" ? "alert" : undefined}
            >
              {state === "error" ? message : "Χωρίς σπαμ. Διαγραφή όποτε θες."}
            </span>
          </form>
        )}
      </div>
    </section>
  );
}
