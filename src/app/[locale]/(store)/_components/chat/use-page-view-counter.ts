"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

const SS_VIEWS = "mm_pageviews";
const SS_AUTOOPENED = "mm_chat_auto_opened";
const LS_SUPPRESS = "mm_chat_suppress_until";

interface Options {
  /** Called once when the third pageview of the session lands AND
   *  auto-open is not suppressed AND has not fired before. */
  onAutoOpenTrigger: () => void;
}

export function usePageViewCounter({ onAutoOpenTrigger }: Options): void {
  const pathname = usePathname();
  useEffect(() => {
    if (typeof window === "undefined") return;

    const prev = Number(sessionStorage.getItem(SS_VIEWS) ?? "0");
    const next = prev + 1;
    sessionStorage.setItem(SS_VIEWS, String(next));

    if (next !== 3) return;
    if (sessionStorage.getItem(SS_AUTOOPENED) === "1") return;

    const suppressUntil = Number(localStorage.getItem(LS_SUPPRESS) ?? "0");
    if (suppressUntil > Date.now()) return;

    sessionStorage.setItem(SS_AUTOOPENED, "1");
    onAutoOpenTrigger();
  }, [pathname, onAutoOpenTrigger]);
}

/** Called when user closes the chat. Sets 24h suppression. */
export function suppressAutoOpenFor24h(): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(LS_SUPPRESS, String(Date.now() + 24 * 60 * 60 * 1000));
}
