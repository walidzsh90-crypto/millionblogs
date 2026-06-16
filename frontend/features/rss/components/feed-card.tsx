import Link from "next/link";

import type { Locale } from "@/i18n/config";
import { localizedPath } from "@/i18n/routing";

import type { FeedResponse } from "../api/rss-api";
import { FeedStatusBadge, FeedHealthBadge } from "./feed-status-badge";
import { getSyncFrequencyLabel } from "../data/sync-frequencies";

type FeedCardProps = {
  feed: FeedResponse;
  locale: Locale;
};

export function FeedCard({ feed, locale }: FeedCardProps) {
  const displayName = feed.title ?? new URL(feed.url).hostname;
  const initials = displayName
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <article className="rounded-lg border border-border bg-surface p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-md border border-border bg-background text-sm font-semibold text-primary">
            {initials}
          </div>
          <div className="min-w-0">
            <h3 className="text-lg font-semibold text-foreground">
              <Link
                href={localizedPath(locale, `/dashboard/feeds/${feed.id}`)}
                className="hover:text-primary"
              >
                {displayName}
              </Link>
            </h3>
            <p className="mt-0.5 truncate text-sm text-muted">{feed.url}</p>
          </div>
        </div>
      </div>

      {feed.description && (
        <p className="mt-3 text-sm leading-6 text-muted line-clamp-2">{feed.description}</p>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <FeedStatusBadge status={feed.status} />
        <FeedHealthBadge score={feed.healthScore} />
        {feed.feedType && (
          <span className="rounded-sm border border-border px-2 py-0.5 text-xs font-semibold text-muted">
            {feed.feedType.toUpperCase()}
          </span>
        )}
        {feed.entryCount !== undefined && (
          <span className="rounded-sm border border-border px-2 py-0.5 text-xs font-semibold text-muted">
            {feed.entryCount} entries
          </span>
        )}
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-muted">
        <span>Sync: {getSyncFrequencyLabel(feed.syncFrequency)}</span>
        {feed.lastSyncAt && (
          <span>Last sync: {new Date(feed.lastSyncAt).toLocaleDateString()}</span>
        )}
      </div>

      <div className="mt-4 flex items-center gap-3">
        <Link
          href={localizedPath(locale, `/dashboard/feeds/${feed.id}`)}
          className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white"
        >
          View
        </Link>
        <Link
          href={localizedPath(locale, `/dashboard/feeds/${feed.id}/edit`)}
          className="rounded-md border border-border px-4 py-2 text-sm font-semibold text-foreground"
        >
          Edit
        </Link>
      </div>
    </article>
  );
}
