"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  lazy,
  Suspense,
} from "react";

// Lazy-load the palette body so its code (and the search fetch path) is only
// shipped/parsed on first open — keeps the Lighthouse gate green (#39).
const CommandPalette = lazy(() =>
  import("./command-palette").then((m) => ({ default: m.CommandPalette })),
);

interface CommandPaletteContextValue {
  isOpen: boolean;
  openPalette: () => void;
  closePalette: () => void;
}

const Ctx = createContext<CommandPaletteContextValue>({
  isOpen: false,
  openPalette: () => {},
  closePalette: () => {},
});

export function useCommandPalette(): CommandPaletteContextValue {
  return useContext(Ctx);
}

export function CommandPaletteProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isOpen, setIsOpen] = useState(false);
  // Element to restore focus to when the palette closes (a11y).
  const triggerRef = useRef<HTMLElement | null>(null);

  const openPalette = useCallback(() => {
    triggerRef.current = (document.activeElement as HTMLElement) ?? null;
    setIsOpen(true);
  }, []);

  const closePalette = useCallback(() => {
    setIsOpen(false);
    triggerRef.current?.focus();
  }, []);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const isCmdK = (e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k";
      if (!isCmdK) return;
      e.preventDefault();
      if (isOpen) {
        closePalette();
      } else {
        openPalette();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [isOpen, openPalette, closePalette]);

  return (
    <Ctx.Provider value={{ isOpen, openPalette, closePalette }}>
      {children}
      {isOpen && (
        <Suspense fallback={null}>
          <CommandPalette onClose={closePalette} />
        </Suspense>
      )}
    </Ctx.Provider>
  );
}
