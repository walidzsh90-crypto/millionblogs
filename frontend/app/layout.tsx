import type { Metadata } from "next";
import type { ReactNode } from "react";

import "@/styles/globals.css";
import { AppProviders } from "@/shared/providers/app-providers";

export const metadata: Metadata = {
  title: {
    default: "MillionBlogs",
    template: "%s | MillionBlogs"
  },
  description: "A multilingual blog discovery platform.",
  applicationName: "MillionBlogs",
  manifest: "/manifest.json"
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
