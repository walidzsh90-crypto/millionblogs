"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

import { localizedPath } from "@/i18n/routing";
import { isSupportedLocale, type Locale } from "@/i18n/config";
import { ErrorState } from "@/shared/components/feedback/error-state";
import { Skeleton } from "@/shared/ui/skeleton/skeleton";

import { rssApi, type FeedResponse, type FeedStats } from "@/features/rss/api/rss-api";
import { FeedCard } from "@/features/rss/components/feed-card";
import { FeedStatistics } from "@/features/rss/components/feed-statistics";

export default function FeedsListPage() {
  const params = useParams();
  const localeParam = String(params.locale ?? "en");
  const locale: Locale = isSupportedLocale(localeParam) ? localeParam : "en";

  const [feeds, setFeeds] = useState<FeedResponse[]>([]);
  const [stats, setStats] = useState<FeedStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [feedsData, statsData] = await Promise.all([
        rssApi.list(),
        rssApi.stats(),
      ]);
      setFeeds(feedsData.items);
      setStats(statsData);
    } catch (err: any) {
      setError(err?.message ?? "Failed to load feeds");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  if (error) {
    return (
      <main className="px-4 py-8">
        <ErrorState title="Failed to load feeds" message={error} reset={load} />
      </main>
    );
  }

  return (
    <main className="px-4 py-8">
      <section className="mx-auto w-full max-w-6xl" aria-labelledby="feeds-list-title">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.14em] text-accent">RSS Management</p>
            <h1 id="feeds-list-title" className="mt-1 text-3xl font-semibold text-foreground">My Feeds</h1>
            <p className="mt-1 text-sm text-muted">Manage your RSS/Atom feeds and their sync status.</p>
          </div>
          <Link
            href={localizedPath(locale, "/dashboard/feeds/new")}
            className="inline-flex min-h-11 items-center rounded-md bg-primary px-5 text-sm font-semibold text-white"
          >
            Add feed
          </Link>
        </div>

        {isLoading ? (
          <>
            <div className="mt-6 grid gap-4 md:grid-cols-2" aria-busy="true">
              <Skeleton className="h-44 w-full" />
              <Skeleton className="h-44 w-full" />
            </div>
          </>
        ) : (
          <>
            {stats && (
              <div className="mt-6">
                <FeedStatistics stats={stats} />
              </div>
            )}

            {feeds.length === 0 ? (
              <div className="mt-12 text-center">
                <h2 className="text-xl font-semibold text-foreground">No feeds yet</h2>
                <p className="mt-2 text-sm text-muted">Add your first RSS or Atom feed to get started.</p>
                <Link
                  href={localizedPath(locale, "/dashboard/feeds/new")}
                  className="mt-6 inline-flex min-h-11 items-center rounded-md bg-primary px-5 text-sm font-semibold text-white"
                >
                  Add your first feed
                </Link>
              </div>
            ) : (
              <div className="mt-6 grid gap-4 md:grid-cols-2">
                {feeds.map((feed) => (
                  <FeedCard key={feed.id} feed={feed} locale={locale} />
                ))}
              </div>
            )}
          </>
        )}
      </section>
    </main>
  );
}
