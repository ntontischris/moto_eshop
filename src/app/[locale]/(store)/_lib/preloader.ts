/* Pure helpers for the S6 session-gated speedometer preloader — no DOM access,
   fully unit-testable. The component (speedometer-preloader.tsx) wires these
   into sessionStorage and a GSAP timeline. */

/* The preloader is a once-per-session flourish: it shows on the first visit of a
   browser session and is absent on every revisit. We treat a thrown access (e.g.
   sessionStorage blocked in private mode) as "already seen" so the overlay never
   blocks the hero in a degraded environment. */

export const PRELOADER_SEEN_KEY = "mm-preloader-seen";

/* sessionStorage is the single source of truth for the session gate. A missing
   key means "first visit this session"; any present value means "seen". */
export function hasSeenPreloader(
  storage: Pick<Storage, "getItem"> | null | undefined,
): boolean {
  if (!storage) return true;
  try {
    return storage.getItem(PRELOADER_SEEN_KEY) !== null;
  } catch {
    return true;
  }
}

/* Records that the preloader ran this session. Swallows storage errors so a
   blocked sessionStorage degrades to "show every time" rather than crashing. */
export function markPreloaderSeen(
  storage: Pick<Storage, "setItem"> | null | undefined,
): void {
  if (!storage) return;
  try {
    storage.setItem(PRELOADER_SEEN_KEY, "1");
  } catch {
    /* storage blocked — nothing to persist */
  }
}

/* The animated speedometer runs only on the first visit of a session AND when
   the user has not asked for reduced motion. Otherwise the overlay is skipped
   entirely and the hero is shown immediately. */
export function shouldRunPreloader(
  alreadySeen: boolean,
  prefersReducedMotion: boolean,
): boolean {
  return !alreadySeen && !prefersReducedMotion;
}

/* Maps a 0..1 animation progress to the displayed km/h reading (0..299),
   zero-padded to three digits to match the fixed-width speedometer face. */
export function speedometerReading(progress: number): string {
  const clamped = Math.min(1, Math.max(0, progress));
  return String(Math.round(clamped * 299)).padStart(3, "0");
}
