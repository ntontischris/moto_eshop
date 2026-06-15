import type { Viewport } from "next";

/* Kept separate from _chrome.tsx on purpose: _chrome loads the campaign-LP
   fonts (Russo One / Chakra Petch) at module level, so any import of it pulls
   5 font files into the importer's critical path (issue #71). */
export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#050608" },
    { media: "(prefers-color-scheme: dark)", color: "#050608" },
  ],
  width: "device-width",
  initialScale: 1,
};
