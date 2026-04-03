"use client";

import dynamic from "next/dynamic";
import { ThemeProvider } from "next-themes";
import { Toaster } from "@/components/ui/sonner";
import { SearchProvider } from "@/components/search/search-provider";

const SmoothScroll = dynamic(
  () =>
    import("@/components/effects/smooth-scroll").then((m) => m.SmoothScroll),
  { ssr: false },
);
const CustomCursor = dynamic(
  () =>
    import("@/components/effects/custom-cursor").then((m) => m.CustomCursor),
  { ssr: false },
);

interface ProvidersProps {
  children: React.ReactNode;
}

export const Providers = ({ children }: ProvidersProps) => (
  <ThemeProvider
    attribute="class"
    defaultTheme="light"
    forcedTheme="light"
    disableTransitionOnChange
  >
    <SearchProvider>{children}</SearchProvider>
    <Toaster />
    <SmoothScroll />
    <CustomCursor />
  </ThemeProvider>
);
