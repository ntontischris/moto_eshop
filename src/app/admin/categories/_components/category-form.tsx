"use client";

import { useTransition } from "react";
import { createCategory } from "@/lib/actions/admin";
import { toast } from "sonner";

interface Props {
  categories: { id: string; name: string; parent_id: string | null }[];
}

export function CategoryForm({ categories }: Props) {
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const form = e.currentTarget;

    startTransition(async () => {
      const result = await createCategory({
        name: fd.get("name") as string,
        slug: fd.get("slug") as string,
        parent_id: (fd.get("parent_id") as string) || null,
        position: parseInt(fd.get("position") as string, 10) || 0,
      });

      if (result.success) {
        toast.success("Η κατηγορία δημιουργήθηκε");
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
      <div className="grid gap-3 sm:grid-cols-2">
        <select name="parent_id" className={inputClass}>
          <option value="">— Κύρια κατηγορία —</option>
          {categories
            .filter((c) => !c.parent_id)
            .map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
        </select>
        <input
          name="position"
          type="number"
          min="0"
          defaultValue="0"
          placeholder="Θέση"
          className={inputClass}
        />
      </div>
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
