"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";

import { localizedPath } from "@/i18n/routing";
import { isSupportedLocale, type Locale } from "@/i18n/config";
import { ErrorState } from "@/shared/components/feedback/error-state";
import { Skeleton } from "@/shared/ui/skeleton/skeleton";

import { blogsApi, type BlogResponse } from "@/features/blogs/api/blogs-api";
import {
  BlogStatusBadge,
  TrustStatusBadge,
  VisibilityBadge,
} from "@/features/blogs/components/blog-status-badge";
import { VerificationStatus } from "@/features/blogs/components/verification/verification-status";
import { BlogDeleteDialog } from "@/features/blogs/components/blog-delete-dialog";

export default function BlogDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const localeParam = String(params.locale ?? "en");
  const blogId = String(params.blogId ?? "");
  const locale: Locale = isSupportedLocale(localeParam) ? localeParam : "en";

  const [blog, setBlog] = useState<BlogResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const loadBlog = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await blogsApi.getById(blogId);
      setBlog(data);
    } catch (err: any) {
      setError(err?.message ?? "Failed to load blog");
    } finally {
      setIsLoading(false);
    }
  }, [blogId]);

  useEffect(() => {
    if (blogId) loadBlog();
  }, [blogId, loadBlog]);

  async function handleDelete() {
    try {
      await blogsApi.remove(blogId);
      router.push(localizedPath(locale, "/dashboard/blogs"));
    } catch (err: any) {
      throw err;
    }
  }

  if (error) {
    return (
      <main className="px-4 py-8">
        <ErrorState title="Failed to load blog" message={error} reset={loadBlog} />
      </main>
    );
  }

  if (isLoading || !blog) {
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

  const initials = blog.name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <main className="px-4 py-8">
      {showDeleteDialog && (
        <BlogDeleteDialog
          blogName={blog.name}
          onConfirm={handleDelete}
          onCancel={() => setShowDeleteDialog(false)}
        />
      )}

      <section className="mx-auto w-full max-w-4xl" aria-labelledby="blog-detail-title">
        <nav className="mb-6 text-sm text-muted" aria-label="Breadcrumb">
          <Link
            href={localizedPath(locale, "/dashboard/blogs")}
            className="font-medium text-primary"
          >
            My Blogs
          </Link>
          <span aria-hidden="true"> / {blog.name}</span>
        </nav>

        <div className="flex flex-wrap items-start justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-lg border border-border bg-background text-xl font-semibold text-primary">
              {initials}
            </div>
            <div>
              <h1
                id="blog-detail-title"
                className="text-3xl font-semibold text-foreground"
              >
                {blog.name}
              </h1>
              <p className="mt-1 text-sm text-muted">{blog.url}</p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <BlogStatusBadge status={blog.status} />
                <TrustStatusBadge trustStatus={blog.trustStatus} />
                <VisibilityBadge visibility={blog.visibility} />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href={localizedPath(locale, `/dashboard/blogs/${blog.id}/edit`)}
              className="min-h-11 rounded-md border border-border px-4 py-2 text-sm font-semibold text-foreground"
            >
              Edit
            </Link>
            <Link
              href={localizedPath(locale, `/dashboard/blogs/${blog.id}/verify`)}
              className="min-h-11 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white"
            >
              Verify
            </Link>
            <button
              type="button"
              onClick={() => setShowDeleteDialog(true)}
              className="min-h-11 rounded-md border border-danger/30 px-4 py-2 text-sm font-semibold text-danger"
            >
              Delete
            </button>
          </div>
        </div>

        <div className="mt-8 grid gap-6 md:grid-cols-2">
          <div className="rounded-lg border border-border bg-surface p-5">
            <h2 className="text-lg font-semibold text-foreground">Blog information</h2>
            <dl className="mt-4 grid gap-3 text-sm">
              <div className="flex items-center justify-between gap-4">
                <dt className="text-muted">Slug</dt>
                <dd className="font-medium text-foreground">{blog.slug}</dd>
              </div>
              <div className="flex items-center justify-between gap-4">
                <dt className="text-muted">Primary language</dt>
                <dd className="font-medium text-foreground">
                  {blog.primaryLanguage.toUpperCase()}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-4">
                <dt className="text-muted">Visibility</dt>
                <dd className="font-medium text-foreground capitalize">
                  {blog.visibility}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-4">
                <dt className="text-muted">Created</dt>
                <dd className="font-medium text-foreground">
                  {new Date(blog.createdAt).toLocaleDateString()}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-4">
                <dt className="text-muted">Updated</dt>
                <dd className="font-medium text-foreground">
                  {new Date(blog.updatedAt).toLocaleDateString()}
                </dd>
              </div>
            </dl>
          </div>

          <VerificationStatus blog={blog} />
        </div>

        {blog.description && (
          <div className="mt-6 rounded-lg border border-border bg-surface p-5">
            <h2 className="text-lg font-semibold text-foreground">Description</h2>
            <p className="mt-2 text-sm leading-6 text-muted">{blog.description}</p>
          </div>
        )}

        {blog.categories.length > 0 && (
          <div className="mt-6 rounded-lg border border-border bg-surface p-5">
            <h2 className="text-lg font-semibold text-foreground">Categories</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {blog.categories.map((cat) => (
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

        {blog.additionalLanguages.length > 0 && (
          <div className="mt-6 rounded-lg border border-border bg-surface p-5">
            <h2 className="text-lg font-semibold text-foreground">
              Additional languages
            </h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {blog.additionalLanguages.map((lang) => (
                <span
                  key={lang}
                  className="rounded-md border border-border bg-background px-3 py-1.5 text-sm text-foreground"
                >
                  {lang.toUpperCase()}
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="mt-6 rounded-lg border border-border bg-surface p-5">
          <h2 className="text-lg font-semibold text-foreground">RSS feed</h2>
          <p className="mt-2 text-sm leading-6 text-muted">
            No RSS feeds configured yet. Feed management will be available in a
            future update.
          </p>
        </div>
      </section>
    </main>
  );
}
