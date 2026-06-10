import { describe, expect, it } from "vitest";
import {
  PRELOADER_SEEN_KEY,
  hasSeenPreloader,
  markPreloaderSeen,
  shouldRunPreloader,
  speedometerReading,
} from "./preloader";

function memoryStorage(initial: Record<string, string> = {}) {
  const map = new Map(Object.entries(initial));
  return {
    getItem: (k: string) => (map.has(k) ? map.get(k)! : null),
    setItem: (k: string, v: string) => void map.set(k, v),
  };
}

describe("hasSeenPreloader", () => {
  it("is false on the first visit of a session", () => {
    expect(hasSeenPreloader(memoryStorage())).toBe(false);
  });

  it("is true once the seen flag is present", () => {
    expect(hasSeenPreloader(memoryStorage({ [PRELOADER_SEEN_KEY]: "1" }))).toBe(
      true,
    );
  });

  it("treats missing storage as already seen (degrade gracefully)", () => {
    expect(hasSeenPreloader(null)).toBe(true);
  });

  it("treats a throwing storage as already seen", () => {
    const blocked = {
      getItem: () => {
        throw new Error("blocked");
      },
    };
    expect(hasSeenPreloader(blocked)).toBe(true);
  });
});

describe("markPreloaderSeen", () => {
  it("persists the seen flag for the rest of the session", () => {
    const storage = memoryStorage();
    markPreloaderSeen(storage);
    expect(hasSeenPreloader(storage)).toBe(true);
  });

  it("does not throw when storage is missing", () => {
    expect(() => markPreloaderSeen(null)).not.toThrow();
  });

  it("does not throw when storage write is blocked", () => {
    const blocked = {
      setItem: () => {
        throw new Error("blocked");
      },
    };
    expect(() => markPreloaderSeen(blocked)).not.toThrow();
  });
});

describe("shouldRunPreloader", () => {
  it("runs on a fresh session, fine pointer, motion allowed", () => {
    expect(
      shouldRunPreloader({
        alreadySeen: false,
        isFinePointer: true,
        prefersReducedMotion: false,
      }),
    ).toBe(true);
  });

  it("is skipped on coarse-pointer / touch (mobile) even on a fresh session", () => {
    expect(
      shouldRunPreloader({
        alreadySeen: false,
        isFinePointer: false,
        prefersReducedMotion: false,
      }),
    ).toBe(false);
  });

  it("is skipped on a revisit within the session", () => {
    expect(
      shouldRunPreloader({
        alreadySeen: true,
        isFinePointer: true,
        prefersReducedMotion: false,
      }),
    ).toBe(false);
  });

  it("is skipped entirely under reduced motion", () => {
    expect(
      shouldRunPreloader({
        alreadySeen: false,
        isFinePointer: true,
        prefersReducedMotion: true,
      }),
    ).toBe(false);
  });

  it("is skipped when already seen and reduced motion", () => {
    expect(
      shouldRunPreloader({
        alreadySeen: true,
        isFinePointer: true,
        prefersReducedMotion: true,
      }),
    ).toBe(false);
  });
});

describe("speedometerReading", () => {
  it("reads 000 at the start", () => {
    expect(speedometerReading(0)).toBe("000");
  });

  it("reads 299 at full speed", () => {
    expect(speedometerReading(1)).toBe("299");
  });

  it("zero-pads to three digits mid-sweep", () => {
    expect(speedometerReading(0.1)).toBe("030");
  });

  it("clamps out-of-range progress", () => {
    expect(speedometerReading(-1)).toBe("000");
    expect(speedometerReading(2)).toBe("299");
  });
});
