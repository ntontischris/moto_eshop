"use client";

import { useTransition } from "react";
import { createBrand } from "@/lib/actions/admin";
import { toast } from "sonner";

export function BrandForm() {
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const form = e.currentTarget;

    startTransition(async () => {
      const result = await createBrand({
        name: fd.get("name") as string,
        slug: fd.get("slug") as string,
        logo_url: (fd.get("logo_url") as string) || undefined,
      });

      if (result.success) {
        toast.success("Το brand δημιουργήθηκε");
        form.reset();
      } else {
        toast.error(result.error);
      }
    });
  }

  const inputClass =
    "w-full rounded-lg border border-border-default bg-bg-elevated px-3 py-2 text-sm text-text-primary placeholder:text-text-muted";

  return (
    <form onSubmit={handleSubmit} className="space-y-3 rounded-xl border border-border-default bg-bg-surface p-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <input name="name" required placeholder="Όνομα" className={inputClass} />
        <input name="slug" required placeholder="Slug" className={inputClass} />
      </div>
      <input name="logo_url" placeholder="Logo URL (προαιρετικό)" className={inputClass} />
      <button
        type="submit"
        disabled={isPending}
        className="rounded-lg bg-brand-teal px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-teal-hover disabled:opacity-50"
      >
        {isPending ? "Αποθήκευση..." : "Προσθήκη"}
      </button>
    </form>
  );
}
