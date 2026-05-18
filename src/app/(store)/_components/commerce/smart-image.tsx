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

  return (
    <Image
      src={src}
      alt={alt}
      fill
      priority={priority}
      sizes={sizes}
      /* Bypass the Next image optimizer: it returns 400 for our
         /api/image-proxy URLs on Vercel. The proxy already serves a
         valid JPEG with 1-year immutable cache, so the browser fetches
         it directly (CDN-cached after first hit). */
      unoptimized
      style={{ objectFit: "cover" }}
      onError={() => setFailed(true)}
    />
  );
}
