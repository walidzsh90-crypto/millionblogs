"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

import { localizedPath } from "@/i18n/routing";
import { isSupportedLocale, type Locale } from "@/i18n/config";
import { ErrorState } from "@/shared/components/feedback/error-state";
import { Skeleton } from "@/shared/ui/skeleton/skeleton";

import { rssApi, type FeedResponse, type FeedLog } from "@/features/rss/api/rss-api";
import { FeedLogsView } from "@/features/rss/components/feed-logs-view";

export default function FeedLogsPage() {
  const params = useParams();
  const localeParam = String(params.locale ?? "en");
  const feedId = String(params.feedId ?? "");
  const locale: Locale = isSupportedLocale(localeParam) ? localeParam : "en";

  const [feed, setFeed] = useState<FeedResponse | null>(null);
  const [logs, setLogs] = useState<FeedLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!feedId) return;
    setIsLoading(true);
    setError(null);
    try {
      const [feedData, logsData] = await Promise.all([
        rssApi.getById(feedId),
        rssApi.logs(feedId, 100),
      ]);
      setFeed(feedData);
      setLogs(logsData);
    } catch (err: any) {
      setError(err?.message ?? "Failed to load logs");
    } finally {
      setIsLoading(false);
    }
  }, [feedId]);

  useEffect(() => { load(); }, [load]);

  const displayName = feed?.title
    ?? (feed ? new URL(feed.url).hostname : "Feed");

  if (error) {
    return (
      <main className="px-4 py-8">
        <ErrorState title="Failed to load logs" message={error} reset={load} />
      </main>
    );
  }

  if (isLoading || !feed) {
    return (
      <main className="px-4 py-8">
        <div className="mx-auto w-full max-w-4xl" aria-busy="true">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="mt-4 h-12 w-full" />
          <Skeleton className="mt-6 h-64 w-full" />
        </div>
      </main>
    );
  }

  return (
    <main className="px-4 py-8">
      <section className="mx-auto w-full max-w-5xl" aria-labelledby="feed-logs-title">
        <nav className="mb-6 text-sm text-muted" aria-label="Breadcrumb">
          <Link
            href={localizedPath(locale, "/dashboard/feeds")}
            className="font-medium text-primary"
          >
            My Feeds
          </Link>
          <span aria-hidden="true"> / </span>
          <Link
            href={localizedPath(locale, `/dashboard/feeds/${feedId}`)}
            className="font-medium text-primary"
          >
            {displayName}
          </Link>
          <span aria-hidden="true"> / Logs</span>
        </nav>

        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.14em] text-accent">RSS Management</p>
            <h1 id="feed-logs-title" className="mt-1 text-3xl font-semibold text-foreground">
              Sync logs
            </h1>
            <p className="mt-1 text-sm text-muted">
              Sync history for <strong>{displayName}</strong>
            </p>
          </div>
          <Link
            href={localizedPath(locale, `/dashboard/feeds/${feedId}`)}
            className="min-h-11 rounded-md border border-border px-4 py-2 text-sm font-semibold text-foreground"
          >
            Back to feed
          </Link>
        </div>

        <div className="mt-6">
          <FeedLogsView logs={logs} isLoading={false} />
        </div>
      </section>
    </main>
  );
}
