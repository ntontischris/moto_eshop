"use client";

import { useState } from "react";
import { subscribeToNewsletter } from "@/lib/actions/newsletter";
import type { Block } from "../schema";

type EmailCapture = Extract<Block, { type: "emailCapture" }>;
type State = "idle" | "loading" | "done" | "error";

export function EmailCaptureBlock({ block }: { block: EmailCapture }) {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<State>("idle");
  const [message, setMessage] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (state === "loading") return;
    setState("loading");
    const res = await subscribeToNewsletter(email, block.source);
    setMessage(res.message);
    setState(res.ok ? "done" : "error");
  }

  return (
    <section className="border-y border-neutral-800 bg-neutral-900/40 py-12">
      <div className="container mx-auto max-w-xl px-4 text-center">
        <h2 className="font-russo text-2xl uppercase text-white">
          {block.title}
        </h2>
        {block.subtitle && (
          <p className="mt-2 text-sm text-neutral-300">{block.subtitle}</p>
        )}
        {state === "done" ? (
          <p className="mt-5 text-sm font-bold text-brand-red" role="status">
            {message}
          </p>
        ) : (
          <form
            onSubmit={handleSubmit}
            noValidate
            className="mx-auto mt-5 flex max-w-md gap-2"
          >
            <input
              type="email"
              inputMode="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email@example.com"
              disabled={state === "loading"}
              className="flex-1 rounded-full border border-neutral-700 bg-black/40 px-4 py-3 text-sm text-white placeholder:text-neutral-500"
            />
            <button
              type="submit"
              disabled={state === "loading"}
              className="rounded-full bg-brand-red px-6 py-3 text-sm font-bold uppercase tracking-wider text-white disabled:opacity-60"
            >
              {block.buttonLabel}
            </button>
          </form>
        )}
        {state === "error" && (
          <p className="mt-2 text-xs text-red-400" role="alert">
            {message}
          </p>
        )}
      </div>
    </section>
  );
}
