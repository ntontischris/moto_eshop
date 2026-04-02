"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { createProduct, updateProduct } from "@/lib/actions/admin";
import { toast } from "sonner";

interface Category {
  id: string;
  name: string;
  parent_id: string | null;
}

interface Brand {
  id: string;
  name: string;
}

interface ProductDefaults {
  id?: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  compare_at_price?: number;
  cost_price?: number;
  stock: number;
  sku: string;
  brand_id: string;
  category_id: string;
  status: "draft" | "active" | "archived";
  certification: string;
  rider_type: string;
}

interface Props {
  categories: Category[];
  brands: Brand[];
  defaultValues?: ProductDefaults;
}

export function ProductForm({ categories, brands, defaultValues }: Props) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const isEdit = !!defaultValues?.id;

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);

    const input = {
      name: fd.get("name") as string,
      slug: fd.get("slug") as string,
      description: (fd.get("description") as string) || undefined,
      price: parseFloat(fd.get("price") as string) || 0,
      compare_at_price: parseFloat(fd.get("compare_at_price") as string) || undefined,
      cost_price: parseFloat(fd.get("cost_price") as string) || undefined,
      stock: parseInt(fd.get("stock") as string, 10) || 0,
      sku: (fd.get("sku") as string) || undefined,
      brand_id: (fd.get("brand_id") as string) || undefined,
      category_id: (fd.get("category_id") as string) || undefined,
      status: (fd.get("status") as "draft" | "active" | "archived") ?? "draft",
      certification: (fd.get("certification") as string) || undefined,
      rider_type: (fd.get("rider_type") as "beginner" | "intermediate" | "advanced" | "professional") || undefined,
    };

    startTransition(async () => {
      const result = isEdit
        ? await updateProduct(defaultValues!.id!, input)
        : await createProduct(input);

      if (result.success) {
        toast.success(isEdit ? "Το προϊόν ενημερώθηκε" : "Το προϊόν δημιουργήθηκε");
        router.push("/admin/products");
      } else {
        toast.error(result.error);
      }
    });
  }

  const inputClass =
    "w-full rounded-lg border border-border-default bg-bg-elevated px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:border-brand-teal focus:outline-none focus:ring-1 focus:ring-brand-teal";
  const labelClass = "block text-sm font-medium text-text-secondary mb-1";

  return (
    <form onSubmit={handleSubmit} className="max-w-3xl space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={labelClass}>Όνομα *</label>
          <input
            name="name"
            required
            defaultValue={defaultValues?.name}
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>Slug *</label>
          <input
            name="slug"
            required
            defaultValue={defaultValues?.slug}
            className={inputClass}
          />
        </div>
      </div>

      <div>
        <label className={labelClass}>Περιγραφή</label>
        <textarea
          name="description"
          rows={4}
          defaultValue={defaultValues?.description}
          className={inputClass}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label className={labelClass}>Τιμή (€) *</label>
          <input
            name="price"
            type="number"
            step="0.01"
            min="0"
            required
            defaultValue={defaultValues?.price}
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>Αρχική Τιμή (€)</label>
          <input
            name="compare_at_price"
            type="number"
            step="0.01"
            min="0"
            defaultValue={defaultValues?.compare_at_price}
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>Κόστος (€)</label>
          <input
            name="cost_price"
            type="number"
            step="0.01"
            min="0"
            defaultValue={defaultValues?.cost_price}
            className={inputClass}
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label className={labelClass}>Stock *</label>
          <input
            name="stock"
            type="number"
            min="0"
            required
            defaultValue={defaultValues?.stock ?? 0}
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>SKU</label>
          <input
            name="sku"
            defaultValue={defaultValues?.sku}
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>Κατάσταση</label>
          <select
            name="status"
            defaultValue={defaultValues?.status ?? "draft"}
            className={inputClass}
          >
            <option value="draft">Draft</option>
            <option value="active">Active</option>
            <option value="archived">Archived</option>
          </select>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={labelClass}>Κατηγορία</label>
          <select
            name="category_id"
            defaultValue={defaultValues?.category_id}
            className={inputClass}
          >
            <option value="">— Χωρίς κατηγορία —</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.parent_id ? "  └ " : ""}{c.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClass}>Brand</label>
          <select
            name="brand_id"
            defaultValue={defaultValues?.brand_id}
            className={inputClass}
          >
            <option value="">— Χωρίς brand —</option>
            {brands.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={labelClass}>Πιστοποίηση</label>
          <input
            name="certification"
            defaultValue={defaultValues?.certification}
            className={inputClass}
            placeholder="π.χ. ECE 22.06"
          />
        </div>
        <div>
          <label className={labelClass}>Τύπος Αναβάτη</label>
          <select
            name="rider_type"
            defaultValue={defaultValues?.rider_type}
            className={inputClass}
          >
            <option value="">— Κανένα —</option>
            <option value="beginner">Αρχάριος</option>
            <option value="intermediate">Μεσαίος</option>
            <option value="advanced">Προχωρημένος</option>
            <option value="professional">Επαγγελματίας</option>
          </select>
        </div>
      </div>

      <div className="flex gap-3 pt-4">
        <button
          type="submit"
          disabled={isPending}
          className="rounded-lg bg-brand-teal px-6 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-teal-hover disabled:opacity-50"
        >
          {isPending
            ? "Αποθήκευση..."
            : isEdit
              ? "Ενημέρωση"
              : "Δημιουργία"}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="rounded-lg border border-border-default px-6 py-2 text-sm text-text-secondary transition-colors hover:bg-bg-elevated"
        >
          Ακύρωση
        </button>
      </div>
    </form>
  );
}
