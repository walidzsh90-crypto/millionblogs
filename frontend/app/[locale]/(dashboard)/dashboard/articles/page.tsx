"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";

import { localizedPath } from "@/i18n/routing";
import { isSupportedLocale, type Locale } from "@/i18n/config";
import { ErrorState } from "@/shared/components/feedback/error-state";
import { Skeleton } from "@/shared/ui/skeleton/skeleton";

import {
  articlesApi,
  type ArticleResponse,
  type ArticleFilter,
} from "@/features/articles/api/articles-api";
import { blogsApi, type BlogResponse, type Category } from "@/features/blogs/api/blogs-api";
import { ArticleCard } from "@/features/articles/components/article-card";
import { ArticleStats } from "@/features/articles/components/article-stats";
import { ArticleFilters } from "@/features/articles/components/article-filters";
import { ArticlePagination } from "@/features/articles/components/article-pagination";

export default function ArticlesListPage() {
  const params = useParams();
  const localeParam = String(params.locale ?? "en");
  const locale: Locale = isSupportedLocale(localeParam) ? localeParam : "en";

  const [articles, setArticles] = useState<ArticleResponse[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [blogs, setBlogs] = useState<BlogResponse[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [languageFilter, setLanguageFilter] = useState("");
  const [blogFilter, setBlogFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");

  useEffect(() => {
    Promise.all([
      blogsApi.myBlogs().catch(() => [] as BlogResponse[]),
      blogsApi.categories.list().catch(() => [] as Category[]),
    ]).then(([b, c]) => {
      setBlogs(b);
      setCategories(c);
    });
  }, []);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const filter: ArticleFilter = { page, pageSize };
      if (search.trim()) filter.search = search.trim();
      if (statusFilter) filter.status = statusFilter as any;
      if (languageFilter) filter.language = languageFilter;
      if (blogFilter) filter.blogId = blogFilter;
      if (categoryFilter) filter.categorySlug = categoryFilter;

      const data = await articlesApi.list(filter);
      setArticles(data.items);
      setTotal(data.total);
      setPage(data.page);
    } catch (err: any) {
      setError(err?.message ?? "Failed to load articles");
    } finally {
      setIsLoading(false);
    }
  }, [page, pageSize, search, statusFilter, languageFilter, blogFilter, categoryFilter]);

  useEffect(() => { load(); }, [load]);

  function handleFiltersChange(filters: {
    search: string;
    status: string;
    language: string;
    blogId: string;
    categorySlug: string;
  }) {
    setSearch(filters.search);
    setStatusFilter(filters.status);
    setLanguageFilter(filters.language);
    setBlogFilter(filters.blogId);
    setCategoryFilter(filters.categorySlug);
    setPage(1);
  }

  const statusCounts: Record<string, number> = {};
  for (const a of articles) {
    statusCounts[a.status] = (statusCounts[a.status] ?? 0) + 1;
  }

  if (error) {
    return (
      <main className="px-4 py-8">
        <ErrorState title="Failed to load articles" message={error} reset={load} />
      </main>
    );
  }

  return (
    <main className="px-4 py-8">
      <section className="mx-auto w-full max-w-6xl" aria-labelledby="articles-list-title">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.14em] text-accent">Articles</p>
          <h1 id="articles-list-title" className="mt-1 text-3xl font-semibold text-foreground">
            My Articles
          </h1>
          <p className="mt-1 text-sm text-muted">
            Browse articles imported from your RSS feeds.
          </p>
        </div>

        {!isLoading && articles.length > 0 && (
          <div className="mt-6">
            <ArticleStats total={total} statusCounts={statusCounts} />
          </div>
        )}

        <div className="mt-6">
          <ArticleFilters
            blogs={blogs.map((b) => ({ id: b.id, name: b.name }))}
            categories={categories.map((c) => ({ id: c.id, slug: c.slug, name: c.name }))}
            value={{
              search,
              status: statusFilter,
              language: languageFilter,
              blogId: blogFilter,
              categorySlug: categoryFilter,
            }}
            onChange={handleFiltersChange}
          />
        </div>

        {isLoading ? (
          <div className="mt-6 grid gap-4" aria-busy="true">
            <Skeleton className="h-40 w-full" />
            <Skeleton className="h-40 w-full" />
            <Skeleton className="h-40 w-full" />
          </div>
        ) : articles.length === 0 ? (
          <div className="mt-12 text-center">
            <h2 className="text-xl font-semibold text-foreground">No articles yet</h2>
            <p className="mt-2 text-sm text-muted">
              Articles from your RSS feeds will appear here once imported.
            </p>
          </div>
        ) : (
          <div className="mt-6 grid gap-4">
            {articles.map((article) => (
              <ArticleCard key={article.id} article={article} locale={locale} />
            ))}
          </div>
        )}

        {!isLoading && articles.length > 0 && (
          <div className="mt-6">
            <ArticlePagination
              page={page}
              pageSize={pageSize}
              total={total}
              onPageChange={setPage}
            />
          </div>
        )}
      </section>
    </main>
  );
}
