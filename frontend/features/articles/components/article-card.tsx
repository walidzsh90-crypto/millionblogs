import Link from "next/link";

import type { Locale } from "@/i18n/config";
import { localizedPath } from "@/i18n/routing";

import type { ArticleResponse } from "../api/articles-api";
import { ArticleStatusBadge } from "./article-status-badge";
import { getLanguageName } from "../data/article-status";

type ArticleCardProps = {
  article: ArticleResponse;
  locale: Locale;
};

export function ArticleCard({ article, locale }: ArticleCardProps) {
  return (
    <article className="rounded-lg border border-border bg-surface p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h3 className="text-lg font-semibold text-foreground">
            <Link
              href={localizedPath(locale, `/dashboard/articles/${article.id}`)}
              className="hover:text-primary"
            >
              {article.title}
            </Link>
          </h3>
          {article.excerpt && (
            <p className="mt-1 text-sm leading-6 text-muted line-clamp-2">{article.excerpt}</p>
          )}
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <ArticleStatusBadge status={article.status} />
        <span className="rounded-sm border border-border px-2 py-0.5 text-xs font-semibold text-muted">
          {getLanguageName(article.language)}
        </span>
        {article.source && (
          <span className="rounded-sm border border-border px-2 py-0.5 text-xs font-semibold text-muted">
            {article.source === "rss" ? "RSS" : article.source}
          </span>
        )}
        {article.author && (
          <span className="rounded-sm border border-border px-2 py-0.5 text-xs font-semibold text-muted">
            {article.author}
          </span>
        )}
      </div>

      {article.categories.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {article.categories.slice(0, 3).map((cat) => (
            <span
              key={cat.id}
              className="rounded-sm bg-muted/20 px-2 py-0.5 text-xs text-muted"
            >
              {cat.name}
            </span>
          ))}
          {article.categories.length > 3 && (
            <span className="text-xs text-muted">+{article.categories.length - 3}</span>
          )}
        </div>
      )}

      <div className="mt-3 flex items-center gap-4 text-xs text-muted">
        {article.publishedAt && (
          <span>{new Date(article.publishedAt).toLocaleDateString()}</span>
        )}
        <span>{article.viewCount} views</span>
        {article.ctr > 0 && <span>{(article.ctr * 100).toFixed(1)}% CTR</span>}
      </div>

      <div className="mt-3 flex items-center gap-3">
        <Link
          href={localizedPath(locale, `/dashboard/articles/${article.id}`)}
          className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white"
        >
          View
        </Link>
        {article.blog && (
          <span className="text-xs text-muted">
            via {article.blog.name}
          </span>
        )}
      </div>
    </article>
  );
}
