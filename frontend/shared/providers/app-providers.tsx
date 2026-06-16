"use client";

import type { ReactNode } from "react";

import { PwaProvider } from "./pwa-provider";
import { ThemeProvider } from "./theme-provider";

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <PwaProvider>{children}</PwaProvider>
    </ThemeProvider>
  );
}
