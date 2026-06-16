"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";

import { localizedPath } from "@/i18n/routing";
import { isSupportedLocale, type Locale } from "@/i18n/config";
import { ErrorState } from "@/shared/components/feedback/error-state";
import { Skeleton } from "@/shared/ui/skeleton/skeleton";

import {
  rssApi,
  type FeedResponse,
  type FeedHealth,
  type FeedEntry,
} from "@/features/rss/api/rss-api";
import { FeedStatusBadge, FeedHealthBadge } from "@/features/rss/components/feed-status-badge";
import { FeedSyncControl } from "@/features/rss/components/feed-sync-control";
import { FeedDeleteDialog } from "@/features/rss/components/feed-delete-dialog";
import { getSyncFrequencyLabel } from "@/features/rss/data/sync-frequencies";

export default function FeedDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const localeParam = String(params.locale ?? "en");
  const feedId = String(params.feedId ?? "");
  const locale: Locale = isSupportedLocale(localeParam) ? localeParam : "en";

  const [feed, setFeed] = useState<FeedResponse | null>(null);
  const [health, setHealth] = useState<FeedHealth | null>(null);
  const [entries, setEntries] = useState<FeedEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const load = useCallback(async () => {
    if (!feedId) return;
    setIsLoading(true);
    setError(null);
    try {
      const [feedData, healthData, entriesData] = await Promise.all([
        rssApi.getById(feedId),
        rssApi.health(feedId),
        rssApi.entries(feedId, 10),
      ]);
      setFeed(feedData);
      setHealth(healthData);
      setEntries(entriesData);
    } catch (err: any) {
      setError(err?.message ?? "Failed to load feed");
    } finally {
      setIsLoading(false);
    }
  }, [feedId]);

  useEffect(() => { load(); }, [load]);

  async function handleDelete() {
    try {
      await rssApi.remove(feedId);
      router.push(localizedPath(locale, "/dashboard/feeds"));
    } catch {
      /* error handled by dialog */
    }
  }

  async function handlePause() {
    if (!feed) return;
    try {
      const updated = await rssApi.pause(feedId);
      setFeed(updated);
    } catch {
      /* ignore */
    }
  }

  async function handleEnable() {
    if (!feed) return;
    try {
      const updated = await rssApi.enable(feedId);
      setFeed(updated);
    } catch {
      /* ignore */
    }
  }

  async function handleDisable() {
    if (!feed) return;
    try {
      const updated = await rssApi.disable(feedId);
      setFeed(updated);
    } catch {
      /* ignore */
    }
  }

  function handleSyncComplete() {
    load();
  }

  if (error) {
    return (
      <main className="px-4 py-8">
        <ErrorState title="Failed to load feed" message={error} reset={load} />
      </main>
    );
  }

  if (isLoading || !feed) {
    return (
      <main className="px-4 py-8">
        <div className="mx-auto w-full max-w-4xl" aria-busy="true">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="mt-4 h-12 w-full" />
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-48 w-full" />
          </div>
        </div>
      </main>
    );
  }

  const displayName = feed.title ?? new URL(feed.url).hostname;
  const initials = displayName
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <main className="px-4 py-8">
      {showDeleteDialog && (
        <FeedDeleteDialog
          feedName={displayName}
          onConfirm={handleDelete}
          onCancel={() => setShowDeleteDialog(false)}
        />
      )}

      <section className="mx-auto w-full max-w-4xl" aria-labelledby="feed-detail-title">
        <nav className="mb-6 text-sm text-muted" aria-label="Breadcrumb">
          <Link
            href={localizedPath(locale, "/dashboard/feeds")}
            className="font-medium text-primary"
          >
            My Feeds
          </Link>
          <span aria-hidden="true"> / {displayName}</span>
        </nav>

        <div className="flex flex-wrap items-start justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-lg border border-border bg-background text-xl font-semibold text-primary">
              {initials}
            </div>
            <div>
              <h1 id="feed-detail-title" className="text-3xl font-semibold text-foreground">
                {displayName}
              </h1>
              <p className="mt-1 text-sm text-muted">{feed.url}</p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <FeedStatusBadge status={feed.status} />
                <FeedHealthBadge score={feed.healthScore} />
                {feed.feedType && (
                  <span className="rounded-sm border border-border px-2 py-0.5 text-xs font-semibold text-muted">
                    {feed.feedType.toUpperCase()}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <FeedSyncControl feedId={feed.id} onSyncComplete={handleSyncComplete} />
            <Link
              href={localizedPath(locale, `/dashboard/feeds/${feed.id}/edit`)}
              className="min-h-11 rounded-md border border-border px-4 py-2 text-sm font-semibold text-foreground"
            >
              Edit
            </Link>
            <Link
              href={localizedPath(locale, `/dashboard/feeds/${feed.id}/logs`)}
              className="min-h-11 rounded-md border border-border px-4 py-2 text-sm font-semibold text-foreground"
            >
              Logs
            </Link>
            {feed.status === "active" ? (
              <button
                type="button"
                onClick={handlePause}
                className="min-h-11 rounded-md border border-warning/30 px-4 py-2 text-sm font-semibold text-warning"
              >
                Pause
              </button>
            ) : feed.status === "paused" ? (
              <button
                type="button"
                onClick={handleEnable}
                className="min-h-11 rounded-md border border-success/30 px-4 py-2 text-sm font-semibold text-success"
              >
                Enable
              </button>
            ) : (
              <button
                type="button"
                onClick={handleEnable}
                className="min-h-11 rounded-md border border-success/30 px-4 py-2 text-sm font-semibold text-success"
              >
                Enable
              </button>
            )}
            {feed.status !== "disabled" && feed.status !== "archived" && (
              <button
                type="button"
                onClick={handleDisable}
                className="min-h-11 rounded-md border border-muted/30 px-4 py-2 text-sm font-semibold text-muted"
              >
                Disable
              </button>
            )}
            <button
              type="button"
              onClick={() => setShowDeleteDialog(true)}
              className="min-h-11 rounded-md border border-danger/30 px-4 py-2 text-sm font-semibold text-danger"
            >
              Remove
            </button>
          </div>
        </div>

        <div className="mt-8 grid gap-6 md:grid-cols-2">
          <div className="rounded-lg border border-border bg-surface p-5">
            <h2 className="text-lg font-semibold text-foreground">Feed information</h2>
            <dl className="mt-4 grid gap-3 text-sm">
              <div className="flex items-center justify-between gap-4">
                <dt className="text-muted">Feed type</dt>
                <dd className="font-medium text-foreground">{feed.feedType ?? "Unknown"}</dd>
              </div>
              {feed.language && (
                <div className="flex items-center justify-between gap-4">
                  <dt className="text-muted">Language</dt>
                  <dd className="font-medium text-foreground">{feed.language.toUpperCase()}</dd>
                </div>
              )}
              {feed.siteUrl && (
                <div className="flex items-center justify-between gap-4">
                  <dt className="text-muted">Site URL</dt>
                  <dd className="max-w-[200px] truncate font-medium text-foreground">
                    <a href={feed.siteUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                      {feed.siteUrl}
                    </a>
                  </dd>
                </div>
              )}
              <div className="flex items-center justify-between gap-4">
                <dt className="text-muted">Sync frequency</dt>
                <dd className="font-medium text-foreground">{getSyncFrequencyLabel(feed.syncFrequency)}</dd>
              </div>
              <div className="flex items-center justify-between gap-4">
                <dt className="text-muted">Priority</dt>
                <dd className="font-medium text-foreground">{feed.priority}</dd>
              </div>
              <div className="flex items-center justify-between gap-4">
                <dt className="text-muted">Created</dt>
                <dd className="font-medium text-foreground">{new Date(feed.createdAt).toLocaleDateString()}</dd>
              </div>
              <div className="flex items-center justify-between gap-4">
                <dt className="text-muted">Updated</dt>
                <dd className="font-medium text-foreground">{new Date(feed.updatedAt).toLocaleDateString()}</dd>
              </div>
            </dl>
          </div>

          <div className="rounded-lg border border-border bg-surface p-5">
            <h2 className="text-lg font-semibold text-foreground">Sync status</h2>
            <dl className="mt-4 grid gap-3 text-sm">
              <div className="flex items-center justify-between gap-4">
                <dt className="text-muted">Last sync</dt>
                <dd className="font-medium text-foreground">
                  {feed.lastSyncAt ? new Date(feed.lastSyncAt).toLocaleString() : "Never"}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-4">
                <dt className="text-muted">Next sync</dt>
                <dd className="font-medium text-foreground">
                  {feed.nextSyncAt ? new Date(feed.nextSyncAt).toLocaleString() : "Not scheduled"}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-4">
                <dt className="text-muted">Last success</dt>
                <dd className="font-medium text-success">
                  {feed.lastSuccessAt ? new Date(feed.lastSuccessAt).toLocaleString() : "Never"}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-4">
                <dt className="text-muted">Last failure</dt>
                <dd className="font-medium text-danger">
                  {feed.lastFailureAt ? new Date(feed.lastFailureAt).toLocaleString() : "None"}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-4">
                <dt className="text-muted">Avg response time</dt>
                <dd className="font-medium text-foreground">
                  {feed.averageResponseTime != null ? `${feed.averageResponseTime}ms` : "N/A"}
                </dd>
              </div>
            </dl>
          </div>
        </div>

        <div className="mt-6 grid gap-6 md:grid-cols-2">
          <div className="rounded-lg border border-border bg-surface p-5">
            <h2 className="text-lg font-semibold text-foreground">Success stats</h2>
            <dl className="mt-4 grid gap-3 text-sm">
              <div className="flex items-center justify-between gap-4">
                <dt className="text-muted">Successful syncs</dt>
                <dd className="font-medium text-success">{feed.successCount}</dd>
              </div>
              <div className="flex items-center justify-between gap-4">
                <dt className="text-muted">Entries</dt>
                <dd className="font-medium text-foreground">{feed.entryCount ?? "N/A"}</dd>
              </div>
            </dl>
          </div>

          <div className="rounded-lg border border-border bg-surface p-5">
            <h2 className="text-lg font-semibold text-foreground">Error stats</h2>
            <dl className="mt-4 grid gap-3 text-sm">
              <div className="flex items-center justify-between gap-4">
                <dt className="text-muted">Failed syncs</dt>
                <dd className="font-medium text-danger">{feed.failureCount}</dd>
              </div>
              <div className="flex items-center justify-between gap-4">
                <dt className="text-muted">Error count</dt>
                <dd className="font-medium text-danger">{feed.errorCount}</dd>
              </div>
              {feed.lastError && (
                <div>
                  <dt className="text-muted">Last error</dt>
                  <dd className="mt-1 rounded-md bg-danger/10 px-3 py-2 text-xs text-danger">
                    {feed.lastError}
                  </dd>
                </div>
              )}
            </dl>
          </div>
        </div>

        {health && (
          <div className="mt-6 rounded-lg border border-border bg-surface p-5">
            <h2 className="text-lg font-semibold text-foreground">Health</h2>
            <dl className="mt-4 grid gap-3 text-sm md:grid-cols-2">
              <div className="flex items-center justify-between gap-4">
                <dt className="text-muted">Health score</dt>
                <dd className="font-medium text-foreground">{health.healthScore}/100</dd>
              </div>
              <div className="flex items-center justify-between gap-4">
                <dt className="text-muted">Success rate</dt>
                <dd className="font-medium text-foreground">{health.successRate}%</dd>
              </div>
              <div className="flex items-center justify-between gap-4">
                <dt className="text-muted">Avg response time</dt>
                <dd className="font-medium text-foreground">
                  {health.averageResponseTime != null ? `${health.averageResponseTime}ms` : "N/A"}
                </dd>
              </div>
            </dl>
          </div>
        )}

        {entries.length > 0 && (
          <div className="mt-6 rounded-lg border border-border bg-surface p-5">
            <h2 className="text-lg font-semibold text-foreground">Recent entries</h2>
            <div className="mt-4 grid gap-3">
              {entries.slice(0, 10).map((entry) => (
                <div key={entry.id} className="border-b border-border/50 pb-3 last:border-b-0">
                  <p className="text-sm font-medium text-foreground">{entry.title}</p>
                  <p className="mt-1 text-xs text-muted">
                    {entry.publishedAt
                      ? new Date(entry.publishedAt).toLocaleDateString()
                      : new Date(entry.discoveredAt).toLocaleDateString()}
                    {entry.author && ` \u2022 ${entry.author}`}
                    {entry.language && ` \u2022 ${entry.language.toUpperCase()}`}
                  </p>
                </div>
              ))}
            </div>
            <Link
              href={localizedPath(locale, `/dashboard/feeds/${feed.id}/logs`)}
              className="mt-4 inline-block text-sm font-medium text-primary hover:underline"
            >
              View all logs and entries
            </Link>
          </div>
        )}

        {feed.description && (
          <div className="mt-6 rounded-lg border border-border bg-surface p-5">
            <h2 className="text-lg font-semibold text-foreground">Description</h2>
            <p className="mt-2 text-sm leading-6 text-muted">{feed.description}</p>
          </div>
        )}
      </section>
    </main>
  );
}
