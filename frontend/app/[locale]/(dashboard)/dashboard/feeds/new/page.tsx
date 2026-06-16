"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

import { localizedPath } from "@/i18n/routing";
import { isSupportedLocale, type Locale } from "@/i18n/config";
import { ErrorState } from "@/shared/components/feedback/error-state";
import { Skeleton } from "@/shared/ui/skeleton/skeleton";

import {
  rssApi,
  type AddFeedInput,
  type SyncFrequencies,
} from "@/features/rss/api/rss-api";
import { FeedForm } from "@/features/rss/components/feed-form";

export default function CreateFeedPage() {
  const params = useParams();
  const router = useRouter();
  const localeParam = String(params.locale ?? "en");
  const locale: Locale = isSupportedLocale(localeParam) ? localeParam : "en";

  const [frequencies, setFrequencies] = useState<SyncFrequencies>({});
  const [isLoadingFrequencies, setIsLoadingFrequencies] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pageError, setPageError] = useState<string | null>(null);

  useEffect(() => {
    rssApi
      .frequencies()
      .then(setFrequencies)
      .catch(() => setFrequencies({}))
      .finally(() => setIsLoadingFrequencies(false));
  }, []);

  async function handleSubmit(data: AddFeedInput) {
    setIsSubmitting(true);
    try {
      const feed = await rssApi.create(data);
      router.push(localizedPath(locale, `/dashboard/feeds/${feed.id}`));
    } catch (err: any) {
      setIsSubmitting(false);
      throw err;
    }
  }

  function handleCancel() {
    router.push(localizedPath(locale, "/dashboard/feeds"));
  }

  if (pageError) {
    return (
      <main className="px-4 py-8">
        <ErrorState title="Something went wrong" message={pageError} />
      </main>
    );
  }

  return (
    <main className="px-4 py-8">
      <section className="mx-auto w-full max-w-3xl" aria-labelledby="create-feed-title">
        <p className="text-sm font-semibold uppercase tracking-[0.14em] text-accent">RSS Management</p>
        <h1 id="create-feed-title" className="mt-1 text-3xl font-semibold text-foreground">
          Add a feed
        </h1>
        <p className="mt-2 text-sm text-muted">
          Add an RSS or Atom feed URL to start importing content.
        </p>

        <div className="mt-8 rounded-lg border border-border bg-surface p-6">
          {isLoadingFrequencies ? (
            <div className="grid gap-4" aria-busy="true">
              <Skeleton className="h-11 w-full" />
              <Skeleton className="h-11 w-full" />
            </div>
          ) : (
            <FeedForm
              mode="create"
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
