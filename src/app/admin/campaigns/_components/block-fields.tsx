"use client";

import { ProductPicker } from "./product-picker";
import {
  BLOCK_DEF_MAP,
  type EditorBlock,
  type FieldDesc,
  type SubField,
} from "./block-descriptors";

const inputCls =
  "w-full rounded-lg border border-border-default bg-bg-elevated px-3 py-2 text-sm text-text-primary placeholder:text-text-muted";

interface Cta {
  label?: string;
  href?: string;
}

type RailSource =
  | { mode: "manual"; productIds: string[] }
  | { mode: "auto"; by: "category" | "brand"; value: string; limit: number };

function CtaInput({
  value,
  optional,
  onChange,
}: {
  value: Cta | undefined;
  optional?: boolean;
  onChange: (v: Cta | undefined) => void;
}) {
  const v = value ?? { label: "", href: "" };
  function set(patch: Partial<Cta>) {
    const next = { label: v.label ?? "", href: v.href ?? "", ...patch };
    if (optional && !next.label && !next.href) onChange(undefined);
    else onChange(next);
  }
  return (
    <div className="flex gap-2">
      <input
        className={inputCls}
        placeholder="Ετικέτα"
        value={v.label ?? ""}
        onChange={(e) => set({ label: e.target.value })}
      />
      <input
        className={inputCls}
        placeholder="/σύνδεσμος"
        value={v.href ?? ""}
        onChange={(e) => set({ href: e.target.value })}
      />
    </div>
  );
}

function ObjectListInput({
  subFields,
  value,
  onChange,
}: {
  subFields: SubField[];
  value: Record<string, unknown>[];
  onChange: (v: Record<string, unknown>[]) => void;
}) {
  function addRow() {
    onChange([...value, Object.fromEntries(subFields.map((f) => [f.key, ""]))]);
  }
  function setRow(i: number, key: string, val: string) {
    const next = [...value];
    next[i] = { ...next[i], [key]: val };
    onChange(next);
  }
  function removeRow(i: number) {
    onChange(value.filter((_, j) => j !== i));
  }
  return (
    <div className="space-y-2">
      {value.map((row, i) => (
        <div
          key={i}
          className="space-y-2 rounded-lg border border-border-default bg-bg-elevated/50 p-2"
        >
          {subFields.map((f) =>
            f.kind === "textarea" ? (
              <textarea
                key={f.key}
                className={inputCls}
                rows={2}
                placeholder={f.label}
                value={(row[f.key] as string) ?? ""}
                onChange={(e) => setRow(i, f.key, e.target.value)}
              />
            ) : (
              <input
                key={f.key}
                className={inputCls}
                placeholder={f.label}
                value={(row[f.key] as string) ?? ""}
                onChange={(e) => setRow(i, f.key, e.target.value)}
              />
            ),
          )}
          <button
            type="button"
            onClick={() => removeRow(i)}
            className="text-xs text-red-400 hover:underline"
          >
            Αφαίρεση
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={addRow}
        className="text-xs text-brand-teal hover:underline"
      >
        + Προσθήκη
      </button>
    </div>
  );
}

function RailSourceInput({
  value,
  onChange,
}: {
  value: RailSource | undefined;
  onChange: (v: RailSource) => void;
}) {
  const src: RailSource = value ?? { mode: "manual", productIds: [] };
  const mode = src.mode === "auto" ? `auto-${src.by}` : "manual";

  function setMode(m: string) {
    if (m === "manual") onChange({ mode: "manual", productIds: [] });
    else if (m === "auto-category")
      onChange({ mode: "auto", by: "category", value: "", limit: 8 });
    else onChange({ mode: "auto", by: "brand", value: "", limit: 8 });
  }

  return (
    <div className="space-y-2">
      <select
        className={inputCls}
        value={mode}
        onChange={(e) => setMode(e.target.value)}
      >
        <option value="manual">Χειροκίνητη επιλογή</option>
        <option value="auto-category">Auto: κατηγορία</option>
        <option value="auto-brand">Auto: brand</option>
      </select>
      {src.mode === "manual" ? (
        <ProductPicker
          value={src.productIds}
          onChange={(ids) => onChange({ mode: "manual", productIds: ids })}
        />
      ) : (
        <div className="flex gap-2">
          <input
            className={inputCls}
            placeholder={src.by === "category" ? "category-slug" : "brand-slug"}
            value={src.value}
            onChange={(e) => onChange({ ...src, value: e.target.value })}
          />
          <input
            className={`${inputCls} w-24`}
            type="number"
            min={1}
            max={24}
            value={src.limit}
            onChange={(e) =>
              onChange({ ...src, limit: Number(e.target.value) || 8 })
            }
          />
        </div>
      )}
    </div>
  );
}

function FieldInput({
  field,
  value,
  onChange,
}: {
  field: FieldDesc;
  value: unknown;
  onChange: (v: unknown) => void;
}) {
  switch (field.kind) {
    case "text":
    case "image":
      return (
        <input
          className={inputCls}
          value={(value as string) ?? ""}
          onChange={(e) => onChange(e.target.value)}
        />
      );
    case "textarea":
      return (
        <textarea
          className={inputCls}
          rows={3}
          value={(value as string) ?? ""}
          onChange={(e) => onChange(e.target.value)}
        />
      );
    case "number":
      return (
        <input
          type="number"
          className={inputCls}
          value={(value as number) ?? 0}
          onChange={(e) => onChange(Number(e.target.value))}
        />
      );
    case "boolean":
      return (
        <input
          type="checkbox"
          checked={Boolean(value)}
          onChange={(e) => onChange(e.target.checked)}
        />
      );
    case "select":
      return (
        <select
          className={inputCls}
          value={(value as string) ?? field.options?.[0]?.value ?? ""}
          onChange={(e) => onChange(e.target.value)}
        >
          {field.options?.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      );
    case "cta":
      return (
        <CtaInput
          value={value as Cta | undefined}
          optional={field.optional}
          onChange={onChange}
        />
      );
    case "products":
      return (
        <ProductPicker value={(value as string[]) ?? []} onChange={onChange} />
      );
    case "objectList":
      return (
        <ObjectListInput
          subFields={field.subFields ?? []}
          value={(value as Record<string, unknown>[]) ?? []}
          onChange={onChange}
        />
      );
    case "railSource":
      return (
        <RailSourceInput
          value={value as RailSource | undefined}
          onChange={onChange}
        />
      );
  }
}

export function BlockFields({
  block,
  onChange,
}: {
  block: EditorBlock;
  onChange: (b: EditorBlock) => void;
}) {
  const def = BLOCK_DEF_MAP[block.type];
  if (!def) {
    return <p className="text-xs text-red-400">Άγνωστος τύπος: {block.type}</p>;
  }
  return (
    <div className="space-y-3">
      {def.fields.map((f) => (
        <div key={f.key}>
          <label className="mb-1 block text-xs font-medium text-text-secondary">
            {f.label}
            {f.optional && (
              <span className="text-text-muted"> (προαιρετικό)</span>
            )}
          </label>
          <FieldInput
            field={f}
            value={block[f.key]}
            onChange={(v) => onChange({ ...block, [f.key]: v })}
          />
        </div>
      ))}
    </div>
  );
}
