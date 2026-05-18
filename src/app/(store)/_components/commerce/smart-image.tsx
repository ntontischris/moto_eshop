"use client";

import Image from "next/image";
import { useState } from "react";

/* SmartImage — next/image (fill) with a branded fallback when the source
   fails (e.g. legacy origin unreachable). Keeps CWV intact: still lazy +
   sized, no extra request on success, placeholder is pure CSS. */

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
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <span className="v3-imgph" aria-hidden={alt ? undefined : true}>
        <span className="v3-imgph-mark">MM</span>
      </span>
    );
  }

  // Mirrored images live on Supabase Storage → next/image CAN optimize
  // them (AVIF/WebP, sized, CDN). Legacy /api/image-proxy URLs make the
  // optimizer 400 on Vercel, so those stay unoptimized (proxy already
  // serves a cached JPEG; browser fetches it directly).
  const isMirrored = src.includes(".supabase.co/storage/");

  return (
    <Image
      src={src}
      alt={alt}
      fill
      priority={priority}
      sizes={sizes}
      unoptimized={!isMirrored}
      style={{ objectFit: "cover" }}
      onError={() => setFailed(true)}
    />
  );
}
