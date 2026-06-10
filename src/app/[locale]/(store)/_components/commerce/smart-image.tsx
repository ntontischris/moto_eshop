"use client";

import Image from "next/image";
import { useState } from "react";

/* SmartImage — next/image (fill) with a branded fallback when the source
   fails. Keeps CWV intact: lazy + sized, srcset where we can optimize. */

const LEGACY_HOST = "motomarket-shop.gr";

type Stage = "opt" | "raw" | "fail";

export function SmartImage({
  src,
  alt,
  sizes,
  priority = false,
}: {
  src: string;
  alt: string;
  sizes: string;
  priority?: boolean;
}) {
  // opt = try optimized · raw = direct unoptimized fallback · fail = placeholder.
  const [stage, setStage] = useState<Stage>("opt");

  if (!src || stage === "fail") {
    return (
      <span className="v3-imgph" aria-hidden={alt ? undefined : true}>
        <span className="v3-imgph-mark">MM</span>
      </span>
    );
  }

  const isSupabase = src.includes(".supabase.co/storage/");
  // The src may already be a same-origin proxied legacy URL (the query layer
  // proxies legacy images so every consumer gets a loadable URL). Detect that
  // first so we optimize it directly instead of wrapping the proxy in itself.
  const isProxied = src.startsWith("/api/image-proxy");
  const isLegacy = !isProxied && src.includes(LEGACY_HOST);

  // Supabase-mirrored images optimize directly. The legacy eshop 403s the
  // optimizer's UA, so route those through our same-origin proxy — Next can
  // then emit AVIF/WebP + a sized srcset. If the optimizer ever fails we fall
  // back to the raw image, then the placeholder, so the catalog never breaks.
  let url = src;
  let unoptimized = true;
  if (isSupabase) {
    unoptimized = false;
  } else if (isProxied && stage === "opt") {
    unoptimized = false;
  } else if (isLegacy && stage === "opt") {
    url = `/api/image-proxy?url=${encodeURIComponent(src)}`;
    unoptimized = false;
  }

  function handleError() {
    setStage((isLegacy || isProxied) && stage === "opt" ? "raw" : "fail");
  }

  return (
    <Image
      src={url}
      alt={alt}
      fill
      priority={priority}
      sizes={sizes}
      unoptimized={unoptimized}
      style={{ objectFit: "cover" }}
      onError={handleError}
    />
  );
}
