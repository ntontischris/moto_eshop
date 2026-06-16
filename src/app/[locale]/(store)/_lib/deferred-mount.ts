/* Pure wiring to defer a heavy below-the-fold island off the initial JS bundle
   — see ADR 0008. The AI chat (~97KB gz: @ai-sdk/react + ai) was shipping
   eagerly in the storefront's initial chunk, contending for bandwidth with the
   hero LCP image on the throttled mobile pipe. This arms a one-shot callback on
   the FIRST of: browser idle (after load) or the user's first interaction —
   whichever comes first — so the chat chunk downloads only once the LCP race is
   won, while keeping the existing auto-open behaviour intact.

   No DOM/React: it takes an injected event target and idle scheduler, so it is
   fully unit-testable (mirrors the _lib gate-predicate pattern). The provider
   component (chat-deferred-mount.tsx) supplies the real window + scheduler and
   does the next/dynamic import once armed. */

/* The cheapest reliable signals that the user is engaging with the page. All
   passive so none of them blocks scrolling. */
export const INTERACTION_EVENTS = [
  "pointerdown",
  "keydown",
  "touchstart",
  "scroll",
  "wheel",
] as const;

type Listenable = {
  addEventListener: (
    type: string,
    cb: () => void,
    opts?: AddEventListenerOptions,
  ) => void;
  removeEventListener: (type: string, cb: () => void) => void;
};

export function armOnIdleOrInteraction(opts: {
  target: Listenable;
  /* Schedules the idle path and returns a function that cancels it. */
  scheduleIdle: (run: () => void) => () => void;
  onArm: () => void;
}): () => void {
  const { target, scheduleIdle, onArm } = opts;
  let armed = false;

  const cleanup = () => {
    cancelIdle();
    for (const evt of INTERACTION_EVENTS) target.removeEventListener(evt, fire);
  };

  function fire() {
    if (armed) return;
    armed = true;
    cleanup();
    onArm();
  }

  const cancelIdle = scheduleIdle(fire);
  for (const evt of INTERACTION_EVENTS) {
    target.addEventListener(evt, fire, { passive: true, once: true });
  }

  return cleanup;
}
