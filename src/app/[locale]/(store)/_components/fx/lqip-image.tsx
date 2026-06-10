"use client";

import Image from "next/image";
import { useState } from "react";
import { lqipBackground } from "../../_lib/lqip";

/* LqipImage — fill image with an instant blur-up placeholder.
   The placeholder layer (tiny LQIP data URI over the designed gradient)
   paints immediately above the image and fades out once the sharp image
   loads. If the image fails it is removed and the placeholder stays, so a
   blocked URL never leaves a broken hole. Zero CLS: fill inside containers
   that already reserve their box. */

type LoadState = "loading" | "loaded" | "failed";

interface LqipImageProps {
  src: string;
  alt: string;
  sizes: string;
  unoptimized?: boolean;
  loading?: "lazy" | "eager";
  fetchPriority?: "high" | "low" | "auto";
}

export function LqipImage({
  src,
  alt,
  sizes,
  unoptimized,
  loading,
  fetchPriority,
}: LqipImageProps) {
  const [state, setState] = useState<LoadState>("loading");

  return (
    <span className="v3-lqip" data-state={state}>
      {state !== "failed" && (
        <Image
          src={src}
          alt={alt}
          fill
          sizes={sizes}
          unoptimized={unoptimized}
          loading={loading}
          fetchPriority={fetchPriority}
          onLoad={() => setState("loaded")}
          onError={() => setState("failed")}
        />
      )}
      <span
        className="v3-lqip-ph"
        aria-hidden="true"
        style={{ backgroundImage: lqipBackground(src) }}
      />
    </span>
  );
}
