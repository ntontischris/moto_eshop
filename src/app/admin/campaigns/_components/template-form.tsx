"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { createCampaignFromTemplate } from "@/lib/actions/campaigns";
import { TEMPLATES, type TemplateField } from "@/lib/campaigns/templates";
import { ImageUpload } from "./image-upload";
import { ProductPicker } from "./product-picker";

const inputCls =
  "w-full rounded-lg border border-border-default bg-bg-elevated px-3 py-2 text-sm text-text-primary placeholder:text-text-muted";

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function toLocal(iso: string): string {
  return iso ? iso.slice(0, 16) : "";
}

function isFieldFilled(field: TemplateField, value: unknown): boolean {
  if (field.optional) return true;
  if (field.kind === "products") {
    const arr = Array.isArray(value) ? value : [];
    const min = field.min ?? 1;
    return arr.length >= min;
  }
  return typeof value === "string" && value.trim().length > 0;
}

export function TemplateForm({ templateId }: { templateId: string }) {
  const tpl = useMemo(
    () => TEMPLATES.find((t) => t.id === templateId),
    [templateId],
  );

  const [fields, setFields] = useState<Record<string, unknown>>({});
  const [name, setName] = useState("");
  const [nameTouched, setNameTouched] = useState(false);
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [error, setError] = useState("");
  const [pending, start] = useTransition();
  const router = useRouter();

  if (!tpl) return null;

  function setField(key: string, value: unknown) {
    setFields((f) => ({ ...f, [key]: value }));
    // Auto-fill campaign name + slug from the hero headline if not touched
    if (key === "heroHeadline" && typeof value === "string" && !nameTouched) {
      setName(value);
      if (!slugTouched) setSlug(slugify(value));
    }
  }

  const allFilled = tpl.fields.every((f) => isFieldFilled(f, fields[f.key]));
  const canSubmit = allFilled && name.trim() && slug.trim();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!canSubmit) return;
    start(async () => {
      const res = await createCampaignFromTemplate({
        templateId: tpl!.id,
        name: name.trim(),
        slug: slug.trim(),
        fields,
      });
      if (!res.success) {
        setError(res.error);
        return;
      }
      router.push(`/admin/campaigns/${res.id}/preview`);
    });
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      {/* Per-template fields */}
      <div className="space-y-4 rounded-xl border border-border-default bg-bg-surface p-4">
        {tpl.fields.map((f) => (
          <FieldRow
            key={f.key}
            field={f}
            value={fields[f.key]}
            onChange={(v) => setField(f.key, v)}
          />
        ))}
      </div>

      {/* Campaign-level (auto-filled, editable) */}
      <details className="rounded-xl border border-border-default bg-bg-surface p-4">
        <summary className="cursor-pointer text-sm font-semibold text-text-primary">
          Όνομα & URL (αυτόματα από το headline — άλλαξέ τα αν θες)
        </summary>
        <div className="mt-3 space-y-3">
          <div>
            <label className="mb-1 block text-xs text-text-secondary">
              Όνομα καμπάνιας
            </label>
            <input
              className={inputCls}
              value={name}
              onChange={(e) => {
                setNameTouched(true);
                setName(e.target.value);
                if (!slugTouched) setSlug(slugify(e.target.value));
              }}
              placeholder="π.χ. Black Friday — Κράνη AGV"
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-text-secondary">
              URL slug
            </label>
            <div className="flex items-center gap-2">
              <span className="text-sm text-text-muted">/lp/</span>
              <input
                className={inputCls}
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
        </div>
      </details>

      {error && <p className="text-sm text-red-400">{error}</p>}

      <button
        type="submit"
        disabled={pending || !canSubmit}
        className="flex w-full items-center justify-center gap-2 rounded-lg bg-brand-teal px-4 py-3 text-sm font-medium text-white hover:bg-brand-teal-hover disabled:cursor-not-allowed disabled:opacity-50"
      >
        {pending ? (
          "Δημιουργία..."
        ) : (
          <>
            Δημιουργία &amp; Preview
            <ArrowRight className="h-4 w-4" />
          </>
        )}
      </button>
      {!canSubmit && !pending && (
        <p className="text-xs text-text-muted">
          Συμπλήρωσε όλα τα υποχρεωτικά πεδία για να συνεχίσεις.
        </p>
      )}
    </form>
  );
}

function FieldRow({
  field,
  value,
  onChange,
}: {
  field: TemplateField;
  value: unknown;
  onChange: (v: unknown) => void;
}) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-text-secondary">
        {field.label}
        {field.optional && (
          <span className="ml-1 text-xs text-text-muted">(προαιρετικό)</span>
        )}
      </label>
      <FieldInput field={field} value={value} onChange={onChange} />
      {field.hint && (
        <p className="mt-1 text-xs text-text-muted">{field.hint}</p>
      )}
    </div>
  );
}

function FieldInput({
  field,
  value,
  onChange,
}: {
  field: TemplateField;
  value: unknown;
  onChange: (v: unknown) => void;
}) {
  switch (field.kind) {
    case "text":
    case "slug":
      return (
        <input
          className={inputCls}
          value={(value as string) ?? ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.hint ?? ""}
        />
      );
    case "textarea":
      return (
        <textarea
          className={inputCls}
          rows={3}
          value={(value as string) ?? ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.hint ?? ""}
        />
      );
    case "datetime":
      return (
        <input
          type="datetime-local"
          className={inputCls}
          value={toLocal((value as string) ?? "")}
          onChange={(e) =>
            onChange(
              e.target.value ? new Date(e.target.value).toISOString() : "",
            )
          }
        />
      );
    case "image":
      return (
        <ImageUpload
          value={(value as string) ?? ""}
          onChange={(url) => onChange(url)}
          aspect="wide"
        />
      );
    case "products":
      return (
        <ProductPicker
          value={Array.isArray(value) ? (value as string[]) : []}
          onChange={(ids) => onChange(ids)}
        />
      );
  }
}
