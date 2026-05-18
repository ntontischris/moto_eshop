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
        <style precedence="default">{`
          .v3-imgph {
            position: absolute; inset: 0; display: flex;
            align-items: center; justify-content: center;
            background:
              radial-gradient(120% 120% at 70% 0%,
                rgba(228,17,31,.16), transparent 60%),
              repeating-linear-gradient(45deg,
                rgba(255,255,255,.025) 0 2px, transparent 2px 6px),
              var(--v3-graphite);
          }
          .v3-imgph-mark {
            font-family: var(--v3-display); font-weight: 900;
            font-size: clamp(2rem, 6vw, 3.4rem); letter-spacing: -.04em;
            color: rgba(245,243,238,.14); transform: skewX(-8deg);
            user-select: none;
          }
        `}</style>
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
