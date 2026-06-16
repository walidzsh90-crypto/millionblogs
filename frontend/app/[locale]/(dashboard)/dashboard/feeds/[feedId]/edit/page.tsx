"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

import { localizedPath } from "@/i18n/routing";
import { isSupportedLocale, type Locale } from "@/i18n/config";
import { ErrorState } from "@/shared/components/feedback/error-state";
import { Skeleton } from "@/shared/ui/skeleton/skeleton";

import {
  rssApi,
  type FeedResponse,
  type UpdateFeedInput,
  type SyncFrequencies,
} from "@/features/rss/api/rss-api";
import { FeedForm } from "@/features/rss/components/feed-form";

export default function EditFeedPage() {
  const params = useParams();
  const router = useRouter();
  const localeParam = String(params.locale ?? "en");
  const feedId = String(params.feedId ?? "");
  const locale: Locale = isSupportedLocale(localeParam) ? localeParam : "en";

  const [feed, setFeed] = useState<FeedResponse | null>(null);
  const [frequencies, setFrequencies] = useState<SyncFrequencies>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pageError, setPageError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!feedId) return;
    setIsLoading(true);
    setPageError(null);
    try {
      const [feedData, freqData] = await Promise.all([
        rssApi.getById(feedId),
        rssApi.frequencies(),
      ]);
      setFeed(feedData);
      setFrequencies(freqData);
    } catch (err: any) {
      setPageError(err?.message ?? "Failed to load feed");
    } finally {
      setIsLoading(false);
    }
  }, [feedId]);

  useEffect(() => { load(); }, [load]);

  async function handleSubmit(data: UpdateFeedInput) {
    setIsSubmitting(true);
    try {
      const updated = await rssApi.update(feedId, data);
      router.push(localizedPath(locale, `/dashboard/feeds/${updated.id}`));
    } catch (err: any) {
      setIsSubmitting(false);
      throw err;
    }
  }

  function handleCancel() {
    router.push(localizedPath(locale, `/dashboard/feeds/${feedId}`));
  }

  if (pageError) {
    return (
      <main className="px-4 py-8">
        <ErrorState title="Failed to load feed" message={pageError} />
      </main>
    );
  }

  const displayName = feed?.title
    ?? (feed ? new URL(feed.url).hostname : "Feed");

  return (
    <main className="px-4 py-8">
      <section className="mx-auto w-full max-w-3xl" aria-labelledby="edit-feed-title">
        <p className="text-sm font-semibold uppercase tracking-[0.14em] text-accent">RSS Management</p>
        <h1 id="edit-feed-title" className="mt-1 text-3xl font-semibold text-foreground">
          Edit feed
        </h1>
        <p className="mt-2 text-sm text-muted">
          Updating settings for <strong>{displayName}</strong>.
        </p>

        <div className="mt-8 rounded-lg border border-border bg-surface p-6">
          {isLoading || !feed ? (
            <div className="grid gap-4" aria-busy="true">
              <Skeleton className="h-11 w-full" />
              <Skeleton className="h-11 w-full" />
              <Skeleton className="h-24 w-full" />
            </div>
          ) : (
            <FeedForm
              mode="edit"
              feed={feed}
              frequencies={frequencies}
              onSubmit={handleSubmit}
              onCancel={handleCancel}
              isSubmitting={isSubmitting}
            />
          )}
        </div>
      </section>
    </main>
  );
}
