"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

import { localizedPath } from "@/i18n/routing";
import { isSupportedLocale, type Locale } from "@/i18n/config";
import { ErrorState } from "@/shared/components/feedback/error-state";
import { Skeleton } from "@/shared/ui/skeleton/skeleton";

import {
  blogsApi,
  type CreateBlogInput,
  type Category,
} from "@/features/blogs/api/blogs-api";
import { BlogForm } from "@/features/blogs/components/blog-form";

export default function CreateBlogPage() {
  const params = useParams();
  const router = useRouter();
  const localeParam = String(params.locale ?? "en");
  const locale: Locale = isSupportedLocale(localeParam) ? localeParam : "en";

  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pageError, setPageError] = useState<string | null>(null);

  useEffect(() => {
    blogsApi.categories
      .list()
      .then(setCategories)
      .catch(() => setCategories([]))
      .finally(() => setIsLoadingCategories(false));
  }, []);

  async function handleSubmit(data: CreateBlogInput) {
    setIsSubmitting(true);
    try {
      const blog = await blogsApi.create(data);
      router.push(
        localizedPath(locale, `/dashboard/blogs/${blog.id}`)
      );
    } catch (err: any) {
      setIsSubmitting(false);
      throw err;
    }
  }

  function handleCancel() {
    router.push(localizedPath(locale, "/dashboard/blogs"));
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
      <section
        className="mx-auto w-full max-w-3xl"
        aria-labelledby="create-blog-title"
      >
        <p className="text-sm font-semibold uppercase tracking-[0.14em] text-accent">
          Blog Management
        </p>
        <h1
          id="create-blog-title"
          className="mt-1 text-3xl font-semibold text-foreground"
        >
          Register a blog
        </h1>
        <p className="mt-2 text-sm text-muted">
          Register your blog to include it in the MillionBlogs directory.
        </p>

        <div className="mt-8 rounded-lg border border-border bg-surface p-6">
          {isLoadingCategories ? (
            <div className="grid gap-4" aria-busy="true">
              <Skeleton className="h-11 w-full" />
              <Skeleton className="h-11 w-full" />
              <Skeleton className="h-24 w-full" />
            </div>
          ) : (
            <BlogForm
              mode="create"
              categories={categories}
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
