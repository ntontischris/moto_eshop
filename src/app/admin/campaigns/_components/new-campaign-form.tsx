"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createCampaign } from "@/lib/actions/campaigns";

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

const input =
  "w-full rounded-lg border border-border-default bg-bg-elevated px-3 py-2 text-sm text-text-primary placeholder:text-text-muted";

export function NewCampaignForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [error, setError] = useState("");
  const [pending, start] = useTransition();

  function onName(value: string) {
    setName(value);
    if (!slugTouched) setSlug(slugify(value));
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    start(async () => {
      const res = await createCampaign({ name, slug });
      if (!res.success) {
        setError(res.error);
        return;
      }
      router.push(`/admin/campaigns/${res.id}/edit`);
    });
  }

  return (
    <form onSubmit={onSubmit} className="mt-6 space-y-4">
      <div>
        <label className="mb-1 block text-sm text-text-secondary">Όνομα</label>
        <input
          className={input}
          value={name}
          onChange={(e) => onName(e.target.value)}
          placeholder="Black Friday — Κράνη AGV"
          required
        />
      </div>
      <div>
        <label className="mb-1 block text-sm text-text-secondary">
          URL slug
        </label>
        <div className="flex items-center gap-2">
          <span className="text-sm text-text-muted">/lp/</span>
          <input
            className={input}
            value={slug}
            onChange={(e) => {
              setSlugTouched(true);
              setSlug(slugify(e.target.value));
            }}
            placeholder="black-friday-agv"
            required
          />
        </div>
      </div>
      {error && <p className="text-sm text-red-400">{error}</p>}
      <button
        type="submit"
        disabled={pending || !name || !slug}
        className="rounded-lg bg-brand-teal px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-teal-hover disabled:opacity-50"
      >
        {pending ? "Δημιουργία..." : "Δημιουργία & επεξεργασία"}
      </button>
    </form>
  );
}
