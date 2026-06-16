"use client";

import { pwaConfig } from "./config";

export async function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) {
    return;
  }

  await navigator.serviceWorker.register(pwaConfig.serviceWorkerPath);
}
