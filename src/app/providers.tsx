"use client";

import { ThemeProvider } from "next-themes";
import { Toaster } from "@/components/ui/sonner";
import { SmoothScroll } from "@/components/effects/smooth-scroll";
import { CustomCursor } from "@/components/effects/custom-cursor";
import { SearchProvider } from "@/components/search/search-provider";

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
