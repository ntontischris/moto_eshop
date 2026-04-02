"use client";

import { useTransition } from "react";
import { updateOrderStatus } from "@/lib/actions/admin";
import { toast } from "sonner";

const STATUSES = [
  "pending",
  "confirmed",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
  "refunded",
] as const;

interface Props {
  orderId: string;
  currentStatus: string;
}

export function OrderStatusForm({ orderId, currentStatus }: Props) {
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const status = fd.get("status") as (typeof STATUSES)[number];
    const note = (fd.get("note") as string) || undefined;

    startTransition(async () => {
      const result = await updateOrderStatus(orderId, { status, note });
      if (result.success) {
        toast.success("Η κατάσταση ενημερώθηκε");
      } else {
        toast.error(result.error);
      }
    });
  }

  const inputClass =
    "w-full rounded-lg border border-border-default bg-bg-elevated px-3 py-2 text-sm text-text-primary placeholder:text-text-muted";

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <select name="status" defaultValue={currentStatus} className={inputClass}>
        {STATUSES.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </select>
      <input
        name="note"
        placeholder="Σημείωση (προαιρετικό)"
        className={inputClass}
      />
      <button
        type="submit"
        disabled={isPending}
        className="w-full rounded-lg bg-brand-teal px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-teal-hover disabled:opacity-50"
      >
        {isPending ? "Ενημέρωση..." : "Ενημέρωση"}
      </button>
    </form>
  );
}
