"use client";

import type { ReactNode } from "react";
import { useEffect } from "react";

import { registerServiceWorker } from "@/pwa/register-service-worker";

export function PwaProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    void registerServiceWorker();
  }, []);

  return children;
}
