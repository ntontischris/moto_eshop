"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Save, Rocket, Eye, Plus, Trash2, Star } from "lucide-react";
import type { CampaignWithVariants, ServingMode } from "@/lib/campaigns/types";
import type { Blocks } from "@/lib/campaigns/blocks/schema";
import type { EditorBlock } from "./block-descriptors";
import { BlockListEditor } from "./block-list-editor";
import { AiBrief } from "./ai-brief";
import type { DraftVariant } from "@/lib/campaigns/ai/repair";
import {
  updateCampaign,
  saveVariant,
  deleteVariant,
  setDefaultVariant,
  publishCampaign,
} from "@/lib/actions/campaigns";

interface EditorVariant {
  id: string;
  name: string;
  weight: number;
  seo: { title?: string; description?: string };
  blocks: EditorBlock[];
}

const inputCls =
  "w-full rounded-lg border border-border-default bg-bg-elevated px-3 py-2 text-sm text-text-primary placeholder:text-text-muted";
const card =
  "rounded-xl border border-border-default bg-bg-surface p-4 space-y-3";

function toLocal(iso: string): string {
  return iso ? iso.slice(0, 16) : "";
}

export function CampaignEditor({
  campaign,
}: {
  campaign: CampaignWithVariants;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [status, setStatus] = useState(campaign.status);
  const [msg, setMsg] = useState("");

  const [name, setName] = useState(campaign.name);
  const [slug, setSlug] = useState(campaign.slug);
  const [redirectUrl, setRedirectUrl] = useState(campaign.redirect_url);
  const [servingMode, setServingMode] = useState<ServingMode>(
    campaign.serving_mode,
  );
  const [startsAt, setStartsAt] = useState(campaign.starts_at ?? "");
  const [expiresAt, setExpiresAt] = useState(campaign.expires_at ?? "");
  const [noindex, setNoindex] = useState(campaign.noindex);
  const [defaultVariantId, setDefaultVariantId] = useState(
    campaign.default_variant_id,
  );

  const [variants, setVariants] = useState<EditorVariant[]>(
    campaign.variants.map((v) => ({
      id: v.id,
      name: v.name,
      weight: v.weight,
      seo: v.seo,
      blocks: v.blocks as unknown as EditorBlock[],
    })),
  );
  const [activeId, setActiveId] = useState<string | null>(
    campaign.variants[0]?.id ?? null,
  );
  const active = variants.find((v) => v.id === activeId) ?? null;

  function flash(m: string) {
    setMsg(m);
    setTimeout(() => setMsg(""), 2500);
  }
  function patchActive(patch: Partial<EditorVariant>) {
    setVariants((vs) =>
      vs.map((v) => (v.id === activeId ? { ...v, ...patch } : v)),
    );
  }

  function saveSettings() {
    start(async () => {
      const res = await updateCampaign(campaign.id, {
        name,
        slug,
        redirect_url: redirectUrl,
        serving_mode: servingMode,
        starts_at: startsAt || null,
        expires_at: expiresAt || null,
        noindex,
        default_variant_id: defaultVariantId,
      });
      if (!res.success) return alert(res.error);
      flash("Ρυθμίσεις αποθηκεύτηκαν");
      router.refresh();
    });
  }

  function saveActive() {
    if (!active) return;
    start(async () => {
      const res = await saveVariant(campaign.id, active.id, {
        // Editor blocks are loose records; saveVariant re-validates with Zod.
        blocks: active.blocks as unknown as Blocks,
        name: active.name,
        weight: active.weight,
        targeting_rules: [],
        seo: active.seo,
      });
      if (!res.success) return alert(res.error);
      flash("Variant αποθηκεύτηκε");
    });
  }

  function addVariant() {
    start(async () => {
      const label = `Variant ${variants.length + 1}`;
      const res = await saveVariant(campaign.id, null, {
        name: label,
        blocks: [],
        weight: 1,
        targeting_rules: [],
        seo: {},
      });
      if (!res.success) return alert(res.error);
      setVariants((vs) => [
        ...vs,
        { id: res.id, name: label, weight: 1, seo: {}, blocks: [] },
      ]);
      setActiveId(res.id);
    });
  }

  function removeVariant(id: string) {
    if (variants.length <= 1) return alert("Πρέπει να υπάρχει ένα variant");
    if (!confirm("Διαγραφή variant;")) return;
    start(async () => {
      const res = await deleteVariant(campaign.id, id);
      if (!res.success) return alert(res.error);
      setVariants((vs) => vs.filter((v) => v.id !== id));
      if (activeId === id) {
        setActiveId(variants.find((v) => v.id !== id)?.id ?? null);
      }
    });
  }

  function makeDefault(id: string) {
    start(async () => {
      const res = await setDefaultVariant(campaign.id, id);
      if (!res.success) return alert(res.error);
      setDefaultVariantId(id);
      flash("Ορίστηκε default");
    });
  }

  function publish() {
    start(async () => {
      const res = await publishCampaign(campaign.id);
      if (!res.success) return alert(res.error);
      setStatus("published");
      flash("Δημοσιεύτηκε");
      router.refresh();
    });
  }

  async function handleGenerated(drafts: DraftVariant[]) {
    const added: EditorVariant[] = [];
    for (const d of drafts) {
      const seo = d.seoTitle ? { title: d.seoTitle } : {};
      const res = await saveVariant(campaign.id, null, {
        name: d.name,
        blocks: d.blocks as unknown as Blocks,
        weight: 1,
        targeting_rules: [],
        seo,
      });
      if (res.success) {
        added.push({
          id: res.id,
          name: d.name,
          weight: 1,
          seo,
          blocks: d.blocks as unknown as EditorBlock[],
        });
      }
    }
    if (added.length > 0) {
      setVariants((vs) => [...vs, ...added]);
      setActiveId(added[0].id);
      flash(`Προστέθηκαν ${added.length} variant(s)`);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl text-text-primary">{name}</h1>
          <p className="text-sm text-text-muted">
            /lp/{slug} · <span className="capitalize">{status}</span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          {msg && <span className="text-sm text-green-400">{msg}</span>}
          {active && (
            <a
              href={`/admin/campaigns/${campaign.id}/preview?v=${active.id}`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1 rounded-lg bg-bg-elevated px-3 py-2 text-sm text-text-secondary hover:text-text-primary"
            >
              <Eye className="h-4 w-4" />
              Preview
            </a>
          )}
          <button
            type="button"
            onClick={publish}
            disabled={pending}
            className="flex items-center gap-1 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-500 disabled:opacity-50"
          >
            <Rocket className="h-4 w-4" />
            Δημοσίευση
          </button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        {/* Settings + variant list */}
        <div className="space-y-4">
          <AiBrief onGenerated={handleGenerated} />

          <div className={card}>
            <h2 className="text-sm font-semibold text-text-primary">
              Ρυθμίσεις
            </h2>
            <label className="block text-xs text-text-secondary">Όνομα</label>
            <input
              className={inputCls}
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <label className="block text-xs text-text-secondary">Slug</label>
            <input
              className={inputCls}
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
            />
            <label className="block text-xs text-text-secondary">
              Redirect μετά τη λήξη
            </label>
            <input
              className={inputCls}
              value={redirectUrl}
              onChange={(e) => setRedirectUrl(e.target.value)}
            />
            <label className="block text-xs text-text-secondary">
              Serving mode
            </label>
            <select
              className={inputCls}
              value={servingMode}
              onChange={(e) => setServingMode(e.target.value as ServingMode)}
            >
              <option value="split">Split (A/B)</option>
              <option value="targeting">Targeting</option>
              <option value="mixed">Mixed</option>
            </select>
            <label className="block text-xs text-text-secondary">Έναρξη</label>
            <input
              type="datetime-local"
              className={inputCls}
              value={toLocal(startsAt)}
              onChange={(e) =>
                setStartsAt(
                  e.target.value ? new Date(e.target.value).toISOString() : "",
                )
              }
            />
            <label className="block text-xs text-text-secondary">Λήξη</label>
            <input
              type="datetime-local"
              className={inputCls}
              value={toLocal(expiresAt)}
              onChange={(e) =>
                setExpiresAt(
                  e.target.value ? new Date(e.target.value).toISOString() : "",
                )
              }
            />
            <label className="flex items-center gap-2 text-xs text-text-secondary">
              <input
                type="checkbox"
                checked={noindex}
                onChange={(e) => setNoindex(e.target.checked)}
              />
              noindex (κρυφό από Google)
            </label>
            <button
              type="button"
              onClick={saveSettings}
              disabled={pending}
              className="flex w-full items-center justify-center gap-1 rounded-lg bg-brand-teal px-3 py-2 text-sm font-medium text-white hover:bg-brand-teal-hover disabled:opacity-50"
            >
              <Save className="h-4 w-4" />
              Αποθήκευση ρυθμίσεων
            </button>
          </div>

          <div className={card}>
            <h2 className="text-sm font-semibold text-text-primary">
              Variants
            </h2>
            <div className="space-y-1">
              {variants.map((v) => (
                <div
                  key={v.id}
                  className={`flex items-center gap-1 rounded-lg px-2 py-1 ${
                    v.id === activeId ? "bg-bg-elevated" : ""
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => setActiveId(v.id)}
                    className="flex-1 text-left text-sm text-text-primary"
                  >
                    {v.name}
                  </button>
                  <button
                    type="button"
                    onClick={() => makeDefault(v.id)}
                    className={`rounded p-1 ${
                      defaultVariantId === v.id
                        ? "text-yellow-400"
                        : "text-text-muted hover:text-yellow-400"
                    }`}
                    title="Ορισμός ως default"
                  >
                    <Star className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => removeVariant(v.id)}
                    className="rounded p-1 text-text-muted hover:text-red-400"
                    title="Διαγραφή variant"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={addVariant}
              disabled={pending || variants.length >= 4}
              className="flex w-full items-center justify-center gap-1 rounded-lg bg-bg-elevated px-3 py-2 text-sm text-text-secondary hover:text-text-primary disabled:opacity-50"
            >
              <Plus className="h-4 w-4" />
              Προσθήκη variant {variants.length >= 4 && "(max 4)"}
            </button>
          </div>
        </div>

        {/* Active variant editor */}
        <div className="space-y-4">
          {active ? (
            <>
              <div className={card}>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs text-text-secondary">
                      Όνομα variant
                    </label>
                    <input
                      className={inputCls}
                      value={active.name}
                      onChange={(e) => patchActive({ name: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-text-secondary">
                      Βάρος (split)
                    </label>
                    <input
                      type="number"
                      min={0}
                      className={inputCls}
                      value={active.weight}
                      onChange={(e) =>
                        patchActive({ weight: Number(e.target.value) || 0 })
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-text-secondary">
                      SEO title
                    </label>
                    <input
                      className={inputCls}
                      value={active.seo.title ?? ""}
                      onChange={(e) =>
                        patchActive({
                          seo: { ...active.seo, title: e.target.value },
                        })
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-text-secondary">
                      SEO description
                    </label>
                    <input
                      className={inputCls}
                      value={active.seo.description ?? ""}
                      onChange={(e) =>
                        patchActive({
                          seo: { ...active.seo, description: e.target.value },
                        })
                      }
                    />
                  </div>
                </div>
              </div>

              <div className={card}>
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-semibold text-text-primary">
                    Blocks
                  </h2>
                  <button
                    type="button"
                    onClick={saveActive}
                    disabled={pending}
                    className="flex items-center gap-1 rounded-lg bg-brand-teal px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-teal-hover disabled:opacity-50"
                  >
                    <Save className="h-4 w-4" />
                    Αποθήκευση variant
                  </button>
                </div>
                <BlockListEditor
                  blocks={active.blocks}
                  onChange={(b) => patchActive({ blocks: b })}
                />
              </div>
            </>
          ) : (
            <p className="text-sm text-text-muted">
              Επίλεξε ή πρόσθεσε variant.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
