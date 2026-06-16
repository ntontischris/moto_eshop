"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { armOnIdleOrInteraction } from "../../_lib/deferred-mount";

/* Deferred client gateway for the AI chat island — see ADR 0008.

   The chat pulls @ai-sdk/react + ai (~97KB gz). As a static import it shipped in
   the storefront's initial JS chunk and contended for bandwidth with the hero
   LCP image on the throttled mobile pipe (the dominant ~1.24s load-delay). A
   <Suspense> boundary did NOT help — it defers render, not download. next/dynamic
   with ssr:false splits the chat into its own chunk that is fetched only after we
   arm (browser idle after load, or the user's first interaction — whichever comes
   first), so it no longer competes with LCP. The page-view auto-open behaviour
   still works: the chat mounts within a second or two of load on a quiet page. */

const ChatMountClient = dynamic(
  () => import("./chat-mount-client").then((m) => m.ChatMountClient),
  { ssr: false },
);

/* Wait for window `load`, then a browser idle slot, before counting the idle
   path as fired — so the chat chunk never queues ahead of the LCP image. Falls
   back to a short timeout where requestIdleCallback is unavailable. */
function scheduleAfterLoadIdle(run: () => void): () => void {
  let cancelIdle = () => {};

  const startIdle = () => {
    if (typeof window.requestIdleCallback === "function") {
      const id = window.requestIdleCallback(run, { timeout: 3000 });
      cancelIdle = () => window.cancelIdleCallback(id);
    } else {
      const id = window.setTimeout(run, 1500);
      cancelIdle = () => window.clearTimeout(id);
    }
  };

  if (document.readyState === "complete") {
    startIdle();
  } else {
    window.addEventListener("load", startIdle, { once: true });
  }

  return () => {
    window.removeEventListener("load", startIdle);
    cancelIdle();
  };
}

export function ChatDeferredMount() {
  const [armed, setArmed] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    return armOnIdleOrInteraction({
      target: window,
      scheduleIdle: scheduleAfterLoadIdle,
      onArm: () => setArmed(true),
    });
  }, []);

  return armed ? <ChatMountClient /> : null;
}
