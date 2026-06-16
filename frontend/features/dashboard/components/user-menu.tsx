"use client";

import { useRouter } from "next/navigation";

import type { Locale } from "@/i18n/config";
import { localizedPath } from "@/i18n/routing";
import { clearSessionMarker } from "@/services/auth/session-marker";
import { tokenStore } from "@/services/auth/token-store";

export function UserMenu({ locale }: { locale: Locale }) {
  const router = useRouter();

  function signOut() {
    tokenStore.clear();
    clearSessionMarker();
    router.push(localizedPath(locale, "/auth/login"));
  }

  return (
    <div className="flex items-center gap-3 rounded-md border border-border bg-background px-3 py-2">
      <div>
        <p className="text-sm font-semibold text-foreground">Blogger</p>
        <p className="text-xs text-muted">Foundation session</p>
      </div>
      <button type="button" onClick={signOut} className="rounded-sm border border-border px-3 py-1.5 text-xs font-semibold text-foreground">
        Sign out
      </button>
    </div>
  );
}
