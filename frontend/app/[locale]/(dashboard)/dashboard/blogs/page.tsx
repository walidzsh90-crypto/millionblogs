"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

import { localizedPath } from "@/i18n/routing";
import { isSupportedLocale, type Locale } from "@/i18n/config";
import { ErrorState } from "@/shared/components/feedback/error-state";
import { Skeleton } from "@/shared/ui/skeleton/skeleton";

import { blogsApi, type BlogResponse } from "@/features/blogs/api/blogs-api";
import { BlogCard } from "@/features/blogs/components/blog-card";

export default function BlogsListPage() {
  const params = useParams();
  const localeParam = String(params.locale ?? "en");
  const locale: Locale = isSupportedLocale(localeParam) ? localeParam : "en";

  const [blogs, setBlogs] = useState<BlogResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadBlogs = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await blogsApi.myBlogs();
      setBlogs(data);
    } catch (err: any) {
      setError(err?.message ?? "Failed to load blogs");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadBlogs();
  }, [loadBlogs]);

  if (error) {
    return (
      <main className="px-4 py-8">
        <ErrorState
          title="Failed to load blogs"
          message={error}
          reset={loadBlogs}
        />
      </main>
    );
  }

  return (
    <main className="px-4 py-8">
      <section className="mx-auto w-full max-w-6xl" aria-labelledby="blogs-list-title">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.14em] text-accent">
              Blog Management
            </p>
            <h1
              id="blogs-list-title"
              className="mt-1 text-3xl font-semibold text-foreground"
            >
              My Blogs
            </h1>
            <p className="mt-1 text-sm text-muted">
              Manage your registered blogs and their verification status.
            </p>
          </div>
          <Link
            href={localizedPath(locale, "/dashboard/blogs/new")}
            className="inline-flex min-h-11 items-center rounded-md bg-primary px-5 text-sm font-semibold text-white"
          >
            Add blog
          </Link>
        </div>

        {isLoading ? (
          <div className="mt-6 grid gap-4" aria-busy="true">
            <Skeleton className="h-40 w-full" />
            <Skeleton className="h-40 w-full" />
          </div>
        ) : blogs.length === 0 ? (
          <div className="mt-12 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-muted/20">
              <svg
                className="h-8 w-8 text-muted"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                />
              </svg>
            </div>
            <h2 className="mt-4 text-xl font-semibold text-foreground">
              No blogs yet
            </h2>
            <p className="mt-2 text-sm text-muted">
              Register your first blog to get started.
            </p>
            <Link
              href={localizedPath(locale, "/dashboard/blogs/new")}
              className="mt-6 inline-flex min-h-11 items-center rounded-md bg-primary px-5 text-sm font-semibold text-white"
            >
              Register your blog
            </Link>
          </div>
        ) : (
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {blogs.map((blog) => (
              <BlogCard key={blog.id} blog={blog} locale={locale} />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
