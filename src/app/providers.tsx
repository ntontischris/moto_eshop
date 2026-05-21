"use client";

import { ThemeProvider } from "next-themes";
import { Toaster } from "@/components/ui/sonner";

export const Providers = () => (
  <ThemeProvider
    attribute="class"
    defaultTheme="light"
    forcedTheme="light"
    disableTransitionOnChange
  >
    <Toaster />
  </ThemeProvider>
);
