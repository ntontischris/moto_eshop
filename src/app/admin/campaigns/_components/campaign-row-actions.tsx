"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Rocket, EyeOff, Copy, Archive, Trash2 } from "lucide-react";
import {
  publishCampaign,
  setCampaignStatus,
  cloneCampaign,
  deleteCampaign,
} from "@/lib/actions/campaigns";

type Result = { success: true } | { success: false; error: string };

export function CampaignRowActions({
  id,
  status,
}: {
  id: string;
  status: string;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();

  function run(fn: () => Promise<Result | { success: true; id: string }>) {
    start(async () => {
      const res = await fn();
      if (res && !res.success) alert(res.error);
      router.refresh();
    });
  }

  const btn =
    "rounded p-1 text-text-muted transition-colors hover:bg-bg-elevated disabled:opacity-50";

  return (
    <div className="flex items-center gap-1">
      {status !== "published" ? (
        <button
          type="button"
          disabled={pending}
          onClick={() => run(() => publishCampaign(id))}
          className={`${btn} hover:text-green-400`}
          aria-label="Δημοσίευση"
          title="Δημοσίευση"
        >
          <Rocket className="h-4 w-4" />
        </button>
      ) : (
        <button
          type="button"
          disabled={pending}
          onClick={() => run(() => setCampaignStatus(id, "draft"))}
          className={`${btn} hover:text-yellow-400`}
          aria-label="Απόσυρση"
          title="Απόσυρση (draft)"
        >
          <EyeOff className="h-4 w-4" />
        </button>
      )}

      <button
        type="button"
        disabled={pending}
        onClick={() => run(() => cloneCampaign(id))}
        className={`${btn} hover:text-brand-teal`}
        aria-label="Κλωνοποίηση"
        title="Κλωνοποίηση"
      >
        <Copy className="h-4 w-4" />
      </button>

      {status !== "archived" && (
        <button
          type="button"
          disabled={pending}
          onClick={() => run(() => setCampaignStatus(id, "archived"))}
          className={`${btn} hover:text-text-secondary`}
          aria-label="Αρχειοθέτηση"
          title="Αρχειοθέτηση"
        >
          <Archive className="h-4 w-4" />
        </button>
      )}

      <button
        type="button"
        disabled={pending}
        onClick={() => {
          if (confirm("Οριστική διαγραφή καμπάνιας;")) {
            run(() => deleteCampaign(id));
          }
        }}
        className={`${btn} hover:text-red-400`}
        aria-label="Διαγραφή"
        title="Διαγραφή"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );
}
