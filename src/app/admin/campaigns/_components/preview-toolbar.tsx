"use client";

import { useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Rocket, ExternalLink, Pencil, ArrowLeft } from "lucide-react";
import { publishCampaign } from "@/lib/actions/campaigns";

export function PreviewToolbar({
  campaignId,
  campaignName,
  variantName,
  status,
  slug,
  skipped,
}: {
  campaignId: string;
  campaignName: string;
  variantName: string;
  status: string;
  slug: string;
  skipped: number;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();

  function publish() {
    start(async () => {
      const res = await publishCampaign(campaignId);
      if (!res.success) {
        alert(res.error);
        return;
      }
      router.refresh();
    });
  }

  const isLive = status === "published";

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 bg-bg-elevated px-4 py-3">
      <div className="flex items-center gap-2 text-xs text-text-muted">
        <Link
          href="/admin/campaigns"
          className="flex items-center gap-1 rounded p-1 hover:bg-bg-surface hover:text-text-primary"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
        </Link>
        <span className="font-medium text-text-primary">{campaignName}</span>
        <span>·</span>
        <span>{variantName}</span>
        <span
          className={`rounded-full px-2 py-0.5 text-[10px] font-medium uppercase ${
            isLive
              ? "bg-green-500/20 text-green-400"
              : "bg-yellow-500/20 text-yellow-400"
          }`}
        >
          {status}
        </span>
        {skipped > 0 && (
          <span className="text-yellow-400">
            ({skipped} block(s) με σφάλματα παραλείφθηκαν)
          </span>
        )}
      </div>

      <div className="flex items-center gap-2">
        <Link
          href={`/admin/campaigns/${campaignId}/edit`}
          className="flex items-center gap-1 rounded-lg bg-bg-surface px-3 py-1.5 text-xs text-text-secondary hover:text-text-primary"
        >
          <Pencil className="h-3.5 w-3.5" />
          Editor
        </Link>
        {isLive ? (
          <a
            href={`/lp/${slug}`}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1 rounded-lg bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-500"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            Άνοιγμα live σελίδας
          </a>
        ) : (
          <button
            type="button"
            onClick={publish}
            disabled={pending}
            className="flex items-center gap-1 rounded-lg bg-green-600 px-4 py-1.5 text-xs font-medium text-white hover:bg-green-500 disabled:opacity-50"
          >
            <Rocket className="h-3.5 w-3.5" />
            {pending ? "Δημοσίευση..." : "Δημοσίευση"}
          </button>
        )}
      </div>
    </div>
  );
}
