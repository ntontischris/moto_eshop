"use client";

import { useState, useTransition } from "react";
import { Sparkles } from "lucide-react";
import { generateCampaignVariants } from "@/lib/campaigns/ai/generate-variants";
import type { DraftVariant } from "@/lib/campaigns/ai/repair";

const inputCls =
  "w-full rounded-lg border border-border-default bg-bg-elevated px-3 py-2 text-sm text-text-primary placeholder:text-text-muted";

export function AiBrief({
  onGenerated,
}: {
  onGenerated: (drafts: DraftVariant[]) => Promise<void>;
}) {
  const [brief, setBrief] = useState("");
  const [count, setCount] = useState(1);
  const [error, setError] = useState("");
  const [pending, start] = useTransition();

  function generate() {
    setError("");
    start(async () => {
      const res = await generateCampaignVariants({
        brief,
        variantCount: count,
      });
      if (!res.success) {
        setError(res.error);
        return;
      }
      await onGenerated(res.variants);
      setBrief("");
    });
  }

  return (
    <div className="space-y-3 rounded-xl border border-brand-teal/40 bg-bg-surface p-4">
      <h2 className="flex items-center gap-2 text-sm font-semibold text-text-primary">
        <Sparkles className="h-4 w-4 text-brand-teal" />
        AI brief
      </h2>
      <textarea
        className={inputCls}
        rows={3}
        value={brief}
        onChange={(e) => setBrief(e.target.value)}
        placeholder="π.χ. Black Friday στα κράνη AGV, -20%, κοινό σπορ αναβάτες, επείγον tone"
      />
      <div className="flex items-center gap-2">
        <label className="text-xs text-text-secondary">Variants</label>
        <select
          className={`${inputCls} w-20`}
          value={count}
          onChange={(e) => setCount(Number(e.target.value))}
        >
          {[1, 2, 3, 4].map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={generate}
          disabled={pending || !brief.trim()}
          className="ml-auto flex items-center gap-1 rounded-lg bg-brand-teal px-4 py-2 text-sm font-medium text-white hover:bg-brand-teal-hover disabled:opacity-50"
        >
          <Sparkles className="h-4 w-4" />
          {pending ? "Δημιουργία..." : "Δημιουργία"}
        </button>
      </div>
      {error && <p className="text-xs text-red-400">{error}</p>}
      <p className="text-xs text-text-muted">
        Το AI φτιάχνει draft variants από τα blocks & το catalog σου. Τα
        ελέγχεις και τα δημοσιεύεις εσύ.
      </p>
    </div>
  );
}
