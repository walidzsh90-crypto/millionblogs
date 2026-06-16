"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";

import type { Locale } from "@/i18n/config";
import { localizedPath } from "@/i18n/routing";
import { notificationsApi } from "../api/notifications-api";

type UnreadBadgeProps = {
  locale: Locale;
  onCountChange?: (count: number) => void;
};

export function UnreadBadge({ locale, onCountChange }: UnreadBadgeProps) {
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchCount = useCallback(async () => {
    try {
      const data = await notificationsApi.unreadCount();
      setCount(data.count);
      onCountChange?.(data.count);
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, [onCountChange]);

  useEffect(() => {
    fetchCount();
    const interval = setInterval(fetchCount, 30000);
    return () => clearInterval(interval);
  }, [fetchCount]);

  if (loading) return null;

  return (
    <Link
      href={localizedPath(locale, "/dashboard/notifications")}
      className="relative inline-flex items-center rounded-md border border-border px-3 py-2 text-sm font-semibold text-foreground hover:bg-muted/20"
      aria-label={`Notifications${count > 0 ? `, ${count} unread` : ""}`}
    >
      <span aria-hidden="true">&#128276;</span>
      {count > 0 && (
        <span className="ml-1.5 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-danger px-1.5 text-xs font-bold text-white">
          {count > 99 ? "99+" : count}
        </span>
      )}
    </Link>
  );
}
