"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

import { localizedPath } from "@/i18n/routing";
import { isSupportedLocale, type Locale } from "@/i18n/config";
import { ErrorState } from "@/shared/components/feedback/error-state";
import { Skeleton } from "@/shared/ui/skeleton/skeleton";

import {
  articlesApi,
  type ArticleResponse,
} from "@/features/articles/api/articles-api";
import { ArticleStatusBadge } from "@/features/articles/components/article-status-badge";
import { getLanguageName } from "@/features/articles/data/article-status";

export default function ArticleDetailsPage() {
  const params = useParams();
  const localeParam = String(params.locale ?? "en");
  const articleId = String(params.articleId ?? "");
  const locale: Locale = isSupportedLocale(localeParam) ? localeParam : "en";

  const [article, setArticle] = useState<ArticleResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!articleId) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await articlesApi.getById(articleId);
      setArticle(data);
    } catch (err: any) {
      setError(err?.message ?? "Failed to load article");
    } finally {
      setIsLoading(false);
    }
  }, [articleId]);

  useEffect(() => { load(); }, [load]);

  if (error) {
    return (
      <main className="px-4 py-8">
        <ErrorState title="Failed to load article" message={error} reset={load} />
      </main>
    );
  }

  if (isLoading || !article) {
    return (
      <main className="px-4 py-8">
        <div className="mx-auto w-full max-w-4xl" aria-busy="true">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="mt-4 h-10 w-3/4" />
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="px-4 py-8">
      <section className="mx-auto w-full max-w-4xl" aria-labelledby="article-detail-title">
        <nav className="mb-6 text-sm text-muted" aria-label="Breadcrumb">
          <Link
            href={localizedPath(locale, "/dashboard/articles")}
            className="font-medium text-primary"
          >
            My Articles
          </Link>
          <span aria-hidden="true"> / {article.title}</span>
        </nav>

        <div className="flex flex-wrap items-start justify-between gap-6">
          <div className="min-w-0 flex-1">
            <h1
              id="article-detail-title"
              className="text-3xl font-semibold text-foreground"
            >
              {article.title}
            </h1>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <ArticleStatusBadge status={article.status} />
              <span className="rounded-sm border border-border px-2 py-0.5 text-xs font-semibold text-muted">
                {getLanguageName(article.language)}
              </span>
              {article.source && (
                <span className="rounded-sm border border-border px-2 py-0.5 text-xs font-semibold text-muted">
                  {article.source === "rss" ? "RSS" : article.source}
                </span>
              )}
            </div>
          </div>

          <a
            href={article.canonicalUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="min-h-11 rounded-md bg-primary px-5 py-2.5 text-sm font-semibold text-white"
          >
            Open original
          </a>
        </div>

        {article.excerpt && (
          <div className="mt-6 rounded-lg border border-border bg-surface p-5">
            <h2 className="text-lg font-semibold text-foreground">Excerpt</h2>
            <p className="mt-2 text-sm leading-6 text-muted">{article.excerpt}</p>
          </div>
        )}

        <div className="mt-6 grid gap-6 md:grid-cols-2">
          <div className="rounded-lg border border-border bg-surface p-5">
            <h2 className="text-lg font-semibold text-foreground">Publication metadata</h2>
            <dl className="mt-4 grid gap-3 text-sm">
              {article.author && (
                <div className="flex items-center justify-between gap-4">
                  <dt className="text-muted">Author</dt>
                  <dd className="font-medium text-foreground">{article.author}</dd>
                </div>
              )}
              <div className="flex items-center justify-between gap-4">
                <dt className="text-muted">Published</dt>
                <dd className="font-medium text-foreground">
                  {article.publishedAt
                    ? new Date(article.publishedAt).toLocaleString()
                    : "Not published"}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-4">
                <dt className="text-muted">Created</dt>
                <dd className="font-medium text-foreground">
                  {new Date(article.createdAt).toLocaleString()}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-4">
                <dt className="text-muted">Updated</dt>
                <dd className="font-medium text-foreground">
                  {new Date(article.updatedAt).toLocaleString()}
                </dd>
              </div>
            </dl>
          </div>

          <div className="rounded-lg border border-border bg-surface p-5">
            <h2 className="text-lg font-semibold text-foreground">Performance</h2>
            <dl className="mt-4 grid gap-3 text-sm">
              <div className="flex items-center justify-between gap-4">
                <dt className="text-muted">Views</dt>
                <dd className="font-medium text-foreground">{article.viewCount}</dd>
              </div>
              <div className="flex items-center justify-between gap-4">
                <dt className="text-muted">Clicks</dt>
                <dd className="font-medium text-foreground">{article.clickCount}</dd>
              </div>
              <div className="flex items-center justify-between gap-4">
                <dt className="text-muted">CTR</dt>
                <dd className="font-medium text-foreground">
                  {article.ctr > 0 ? `${(article.ctr * 100).toFixed(2)}%` : "0%"}
                </dd>
              </div>
            </dl>
          </div>
        </div>

        <div className="mt-6 grid gap-6 md:grid-cols-2">
          <div className="rounded-lg border border-border bg-surface p-5">
            <h2 className="text-lg font-semibold text-foreground">Language</h2>
            <dl className="mt-4 grid gap-3 text-sm">
              <div className="flex items-center justify-between gap-4">
                <dt className="text-muted">Language</dt>
                <dd className="font-medium text-foreground">
                  {getLanguageName(article.language)}
                </dd>
              </div>
              {article.languageConfidence != null && (
                <div className="flex items-center justify-between gap-4">
                  <dt className="text-muted">Confidence</dt>
                  <dd className="font-medium text-foreground">
                    {(article.languageConfidence * 100).toFixed(0)}%
                  </dd>
                </div>
              )}
            </dl>
          </div>

          <div className="rounded-lg border border-border bg-surface p-5">
            <h2 className="text-lg font-semibold text-foreground">Source</h2>
            <dl className="mt-4 grid gap-3 text-sm">
              <div className="flex items-center justify-between gap-4">
                <dt className="text-muted">Import type</dt>
                <dd className="font-medium text-foreground">
                  {article.source === "rss" ? "RSS Feed" : article.source ?? "Unknown"}
                </dd>
              </div>
              {article.importSource && (
                <div>
                  <dt className="text-muted">Import source</dt>
                  <dd className="mt-1 break-all text-xs text-foreground">
                    {article.importSource}
                  </dd>
                </div>
              )}
              {article.blog && (
                <div className="flex items-center justify-between gap-4">
                  <dt className="text-muted">Blog</dt>
                  <dd className="font-medium text-foreground">
                    <Link
                      href={localizedPath(locale, `/dashboard/blogs/${article.blog.id}`)}
                      className="text-primary hover:underline"
                    >
                      {article.blog.name}
                    </Link>
                  </dd>
                </div>
              )}
            </dl>
          </div>
        </div>

        {article.categories.length > 0 && (
          <div className="mt-6 rounded-lg border border-border bg-surface p-5">
            <h2 className="text-lg font-semibold text-foreground">Categories</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {article.categories.map((cat) => (
                <span
                  key={cat.id}
                  className="rounded-md border border-border bg-background px-3 py-1.5 text-sm text-foreground"
                >
                  {cat.name}
                </span>
              ))}
            </div>
          </div>
        )}

        {article.featuredImageUrl && (
          <div className="mt-6 rounded-lg border border-border bg-surface p-5">
            <h2 className="text-lg font-semibold text-foreground">Featured image</h2>
            <div className="mt-3">
              <img
                src={article.featuredImageUrl}
                alt=""
                className="max-h-64 w-full rounded-md object-cover"
                loading="lazy"
              />
            </div>
          </div>
        )}

        <div className="mt-6 rounded-lg border border-border bg-surface p-5">
          <h2 className="text-lg font-semibold text-foreground">Canonical URL</h2>
          <a
            href={article.canonicalUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 inline-block break-all text-sm text-primary hover:underline"
          >
            {article.canonicalUrl}
          </a>
        </div>
      </section>
    </main>
  );
}
