"use client";

import { useRef, useState, useTransition } from "react";
import { Image as ImageIcon, X, Loader2 } from "lucide-react";
import { uploadCampaignImage } from "@/lib/campaigns/storage";

export function ImageUpload({
  value,
  onChange,
  aspect,
}: {
  value: string;
  onChange: (url: string) => void;
  aspect?: "wide" | "square";
}) {
  const ref = useRef<HTMLInputElement>(null);
  const [pending, start] = useTransition();
  const [error, setError] = useState("");

  function pick() {
    ref.current?.click();
  }

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setError("");
    const fd = new FormData();
    fd.append("file", f);
    start(async () => {
      const res = await uploadCampaignImage(fd);
      if (!res.success) {
        setError(res.error);
        return;
      }
      onChange(res.url);
    });
    if (ref.current) ref.current.value = "";
  }

  const previewCls = aspect === "square" ? "aspect-square" : "aspect-[16/9]";

  return (
    <div className="space-y-2">
      <input
        ref={ref}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={onFile}
      />
      {value ? (
        <div
          className={`group relative w-full overflow-hidden rounded-lg border border-border-default bg-bg-elevated ${previewCls}`}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={value} alt="" className="h-full w-full object-cover" />
          <button
            type="button"
            onClick={() => onChange("")}
            className="absolute right-2 top-2 rounded-full bg-black/70 p-1.5 text-white hover:bg-red-600"
            aria-label="Αφαίρεση"
          >
            <X className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={pick}
            disabled={pending}
            className="absolute bottom-2 right-2 rounded-lg bg-black/70 px-3 py-1.5 text-xs text-white hover:bg-black"
          >
            {pending ? "Ανέβασμα..." : "Αλλαγή"}
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={pick}
          disabled={pending}
          className={`flex w-full flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border-default bg-bg-elevated/50 text-text-muted hover:border-brand-teal hover:text-brand-teal disabled:opacity-50 ${previewCls}`}
        >
          {pending ? (
            <Loader2 className="h-6 w-6 animate-spin" />
          ) : (
            <ImageIcon className="h-6 w-6" />
          )}
          <span className="text-sm">
            {pending ? "Ανέβασμα..." : "Ανέβασε εικόνα"}
          </span>
          <span className="text-xs">jpg / png / webp · έως 5MB</span>
        </button>
      )}
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}
