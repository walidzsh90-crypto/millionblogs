import Link from "next/link";

import type { Locale } from "@/i18n/config";
import { localizedPath } from "@/i18n/routing";

import type { BlogResponse } from "../api/blogs-api";
import { BlogStatusBadge, VisibilityBadge } from "./blog-status-badge";

type BlogCardProps = {
  blog: BlogResponse;
  locale: Locale;
};

export function BlogCard({ blog, locale }: BlogCardProps) {
  const initials = blog.name
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
          <div>
            <h3 className="text-lg font-semibold text-foreground">
              <Link
                href={localizedPath(locale, `/dashboard/blogs/${blog.id}`)}
                className="hover:text-primary"
              >
                {blog.name}
              </Link>
            </h3>
            <p className="mt-0.5 text-sm text-muted">{blog.url}</p>
          </div>
        </div>
      </div>

      {blog.description && (
        <p className="mt-3 text-sm leading-6 text-muted line-clamp-2">
          {blog.description}
        </p>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <BlogStatusBadge status={blog.status} />
        <VisibilityBadge visibility={blog.visibility} />
        <span className="rounded-sm border border-border px-2 py-0.5 text-xs font-semibold text-muted">
          {blog.primaryLanguage.toUpperCase()}
        </span>
        {blog.categories.length > 0 && (
          <span className="rounded-sm border border-border px-2 py-0.5 text-xs font-semibold text-muted">
            {blog.categories.length} {blog.categories.length === 1 ? "category" : "categories"}
          </span>
        )}
      </div>

      <div className="mt-4 flex items-center gap-3">
        <Link
          href={localizedPath(locale, `/dashboard/blogs/${blog.id}`)}
          className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white"
        >
          View
        </Link>
        <Link
          href={localizedPath(locale, `/dashboard/blogs/${blog.id}/edit`)}
          className="rounded-md border border-border px-4 py-2 text-sm font-semibold text-foreground"
        >
          Edit
        </Link>
      </div>
    </article>
  );
}
