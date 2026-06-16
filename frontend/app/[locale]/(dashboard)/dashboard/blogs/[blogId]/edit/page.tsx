"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";

import { localizedPath } from "@/i18n/routing";
import { isSupportedLocale, type Locale } from "@/i18n/config";
import { ErrorState } from "@/shared/components/feedback/error-state";
import { Skeleton } from "@/shared/ui/skeleton/skeleton";

import {
  blogsApi,
  type BlogResponse,
  type UpdateBlogInput,
  type Category,
} from "@/features/blogs/api/blogs-api";
import { BlogForm } from "@/features/blogs/components/blog-form";

export default function EditBlogPage() {
  const params = useParams();
  const router = useRouter();
  const localeParam = String(params.locale ?? "en");
  const blogId = String(params.blogId ?? "");
  const locale: Locale = isSupportedLocale(localeParam) ? localeParam : "en";

  const [blog, setBlog] = useState<BlogResponse | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [blogData, cats] = await Promise.all([
        blogsApi.getById(blogId),
        blogsApi.categories.list(),
      ]);
      setBlog(blogData);
      setCategories(cats);
    } catch (err: any) {
      setError(err?.message ?? "Failed to load blog data");
    } finally {
      setIsLoading(false);
    }
  }, [blogId]);

  useEffect(() => {
    if (blogId) loadData();
  }, [blogId, loadData]);

  async function handleSubmit(data: UpdateBlogInput) {
    setIsSubmitting(true);
    try {
      const updated = await blogsApi.update(blogId, data);
      router.push(
        localizedPath(locale, `/dashboard/blogs/${updated.id}`)
      );
    } catch (err: any) {
      setIsSubmitting(false);
      throw err;
    }
  }

  function handleCancel() {
    router.push(localizedPath(locale, `/dashboard/blogs/${blogId}`));
  }

  if (error) {
    return (
      <main className="px-4 py-8">
        <ErrorState title="Failed to load blog" message={error} reset={loadData} />
      </main>
    );
  }

  if (isLoading || !blog) {
    return (
      <main className="px-4 py-8">
        <div className="mx-auto w-full max-w-3xl" aria-busy="true">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="mt-6 h-11 w-full" />
          <Skeleton className="mt-4 h-11 w-full" />
          <Skeleton className="mt-4 h-24 w-full" />
        </div>
      </main>
    );
  }

  return (
    <main className="px-4 py-8">
      <section className="mx-auto w-full max-w-3xl" aria-labelledby="edit-blog-title">
        <nav className="mb-6 text-sm text-muted" aria-label="Breadcrumb">
          <Link
            href={localizedPath(locale, "/dashboard/blogs")}
            className="font-medium text-primary"
          >
            My Blogs
          </Link>
          <span aria-hidden="true"> / </span>
          <Link
            href={localizedPath(locale, `/dashboard/blogs/${blogId}`)}
            className="font-medium text-primary"
          >
            {blog.name}
          </Link>
          <span aria-hidden="true"> / Edit</span>
        </nav>

        <p className="text-sm font-semibold uppercase tracking-[0.14em] text-accent">
          Blog Management
        </p>
        <h1
          id="edit-blog-title"
          className="mt-1 text-3xl font-semibold text-foreground"
        >
          Edit blog
        </h1>
        <p className="mt-2 text-sm text-muted">Update your blog information.</p>

        <div className="mt-8 rounded-lg border border-border bg-surface p-6">
          <BlogForm
            mode="edit"
            blog={blog}
            categories={categories}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            isSubmitting={isSubmitting}
          />
        </div>
      </section>
    </main>
  );
}
