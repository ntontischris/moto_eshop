"use client";

import { useState } from "react";
import { ArrowRight } from "lucide-react";
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
        <div className="v3-nl-copy">
          <p className="v3-label">Μπες στο pit-lane</p>
          <h2 className="v3-display">
            −10% στην πρώτη σου
            <br />
            <em>παραγγελία.</em>
          </h2>
          <p className="v3-nl-sub">
            Νέες παραλαβές, προσφορές & gear — πρώτος. Χωρίς σπαμ.
          </p>
        </div>

        {state === "done" ? (
          <p className="v3-nl-done" role="status">
            {message}
          </p>
        ) : (
          <form className="v3-nl-form" onSubmit={handleSubmit} noValidate>
            <div className="v3-nl-field">
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
              <button type="submit" disabled={state === "loading"}>
                {state === "loading" ? (
                  "..."
                ) : (
                  <>
                    Εγγραφή <ArrowRight size={16} aria-hidden="true" />
                  </>
                )}
              </button>
            </div>
            {state === "error" && (
              <span className="v3-nl-err" role="alert">
                {message}
              </span>
            )}
          </form>
        )}
      </div>
    </section>
  );
}
