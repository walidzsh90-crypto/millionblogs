import type { Metadata } from "next";
import Link from "next/link";

import { isSupportedLocale, supportedLocales, type Locale } from "@/i18n/config";
import { localizedPath, resolveLocale } from "@/i18n/routing";
import { createCanonicalPath } from "@/seo/canonical";
import { createHreflangAlternates } from "@/seo/hreflang";
import { createMetadata } from "@/seo/metadata";
import { fetchSearch, fetchBlogs, extractCategories } from "@/shared/api/data";

export const dynamic = "force-dynamic";

type SearchPageProps = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

type SearchParams = {
  q: string;
  language: string;
  categorySlug: string;
  blogSlug: string;
  page: number;
};

const pageSize = 12;

function firstValue(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
}

function parseSearchParams(params: Record<string, string | string[] | undefined>): SearchParams {
  const rawPage = Number(firstValue(params.page));
  return {
    q: firstValue(params.q).trim(),
    language: firstValue(params.language),
    categorySlug: firstValue(params.category),
    blogSlug: firstValue(params.blog),
    page: Number.isFinite(rawPage) && rawPage > 0 ? Math.floor(rawPage) : 1,
  };
}

function href(locale: Locale, path = "/") {
  return localizedPath(locale, path);
}

function searchHref(locale: Locale, query: SearchParams, overrides: Partial<SearchParams> = {}) {
  const nextQuery = { ...query, ...overrides };
  const params = new URLSearchParams();
  if (nextQuery.q) params.set("q", nextQuery.q);
  if (nextQuery.language) params.set("language", nextQuery.language);
  if (nextQuery.categorySlug) params.set("category", nextQuery.categorySlug);
  if (nextQuery.blogSlug) params.set("blog", nextQuery.blogSlug);
  if (nextQuery.page > 1) params.set("page", String(nextQuery.page));
  const suffix = params.toString();
  return `${href(locale, "/search")}${suffix ? `?${suffix}` : ""}`;
}

function formatDate(value: string | null, locale: Locale): string {
  if (!value) return "";
  return new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(value));
}

export async function generateMetadata({ params, searchParams }: SearchPageProps): Promise<Metadata> {
  const { locale: localeParam } = await params;
  const rawSearchParams = await searchParams;
  const locale = resolveLocale(localeParam);
  const query = parseSearchParams(rawSearchParams);
  const title = query.q ? `Search results for ${query.q}` : "Search MillionBlogs";

  return createMetadata({
    title,
    description: "Search MillionBlogs for independent articles, blogs, categories, and languages.",
    canonicalPath: createCanonicalPath(locale, "/search"),
    languages: createHreflangAlternates("/search"),
    noIndex: true,
  });
}

export default async function SearchPage({ params, searchParams }: SearchPageProps) {
  const { locale: localeParam } = await params;
  const rawSearchParams = await searchParams;
  const locale = isSupportedLocale(localeParam) ? localeParam : "en";
  const query = parseSearchParams(rawSearchParams);
  const hasActiveSearch = Boolean(query.q || query.language || query.categorySlug || query.blogSlug);

  const [searchData, blogData] = await Promise.all([
    hasActiveSearch
      ? fetchSearch({
          q: query.q || "",
          language: query.language || undefined,
          categorySlug: query.categorySlug || undefined,
          blogSlug: query.blogSlug || undefined,
          page: query.page,
          pageSize,
        })
      : Promise.resolve(null),
    fetchBlogs({ pageSize: 100 }),
  ]);

  const categories = await extractCategories(blogData?.items ?? null);
  const blogOptions = blogData?.items?.map((b) => ({ slug: b.slug, name: b.name })) ?? [];

  const results = searchData?.results ?? [];
  const totalPages = searchData?.totalPages ?? 1;
  const currentPage = Math.min(query.page, totalPages);
  const visibleArticles = results.filter((r) => r.type === "article");
  const visibleBlogs = results.filter((r) => r.type === "blog");
  const totalResults = searchData?.total ?? 0;

  const resultLabel = !hasActiveSearch
    ? "Enter a query or choose filters to search the directory."
    : totalResults === 1
      ? "1 result found"
      : `${totalResults} results found`;

  return (
    <main className="bg-background text-foreground">
      <section className="border-b border-border bg-surface/50 px-6 py-12 lg:px-8">
        <div className="mx-auto w-full max-w-7xl text-start">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-accent">Directory search</p>
          <h1 className="mt-4 text-4xl font-semibold leading-tight text-foreground md:text-5xl">Search MillionBlogs</h1>
          <p className="mt-4 max-w-3xl text-base leading-7 text-muted">
            Find independent articles and blogs by keyword, language, category, or publisher.
          </p>
        </div>
      </section>

      <section className="border-b border-border px-6 py-6 lg:px-8" aria-labelledby="search-form-title">
        <div className="mx-auto w-full max-w-7xl">
          <h2 id="search-form-title" className="sr-only">
            Search filters
          </h2>
          <form action={href(locale, "/search")} className="grid gap-4 lg:grid-cols-[1.3fr_0.7fr_0.7fr_0.8fr_auto]" role="search">
            <div>
              <label htmlFor="q" className="mb-2 block text-sm font-medium text-foreground">
                Search
              </label>
              <input
                id="q"
                name="q"
                type="search"
                defaultValue={query.q}
                placeholder="Search articles or blogs"
                className="min-h-11 w-full rounded-md border border-border bg-background px-4 text-base text-foreground placeholder:text-muted"
              />
            </div>

            <div>
              <label htmlFor="language" className="mb-2 block text-sm font-medium text-foreground">
                Language
              </label>
              <select
                id="language"
                name="language"
                defaultValue={query.language}
                className="min-h-11 w-full rounded-md border border-border bg-background px-3 text-base text-foreground"
              >
                <option value="">All languages</option>
                {supportedLocales.map((language) => (
                  <option key={language} value={language}>
                    {language.toUpperCase()}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="category" className="mb-2 block text-sm font-medium text-foreground">
                Category
              </label>
              <select
                id="category"
                name="category"
                defaultValue={query.categorySlug}
                className="min-h-11 w-full rounded-md border border-border bg-background px-3 text-base text-foreground"
              >
                <option value="">All categories</option>
                {categories.map((cat) => (
                  <option key={cat.slug} value={cat.slug}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="blog" className="mb-2 block text-sm font-medium text-foreground">
                Blog
              </label>
              <select
                id="blog"
                name="blog"
                defaultValue={query.blogSlug}
                className="min-h-11 w-full rounded-md border border-border bg-background px-3 text-base text-foreground"
              >
                <option value="">All blogs</option>
                {blogOptions.map((blog) => (
                  <option key={blog.slug} value={blog.slug}>
                    {blog.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-end gap-3">
              <button type="submit" className="min-h-11 w-full rounded-md bg-primary px-5 text-sm font-semibold text-white lg:w-auto">
                Search
              </button>
              <Link
                href={href(locale, "/search")}
                className="inline-flex min-h-11 items-center rounded-md border border-border px-4 text-sm font-semibold text-foreground"
              >
                Reset
              </Link>
            </div>
          </form>
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-6 py-10 lg:px-8" aria-labelledby="search-results-title">
        <div className="flex flex-col gap-2 border-b border-border pb-5 text-start md:flex-row md:items-end md:justify-between">
          <div>
            <h2 id="search-results-title" className="text-2xl font-semibold text-foreground">
              Results
            </h2>
            <p className="mt-2 text-sm text-muted" aria-live="polite">
              {resultLabel}
            </p>
          </div>
          {hasActiveSearch ? (
            <p className="text-sm text-muted">
              Page {currentPage} of {totalPages}
            </p>
          ) : null}
        </div>

        {results.length === 0 ? (
          <div className="mt-8 rounded-lg border border-border bg-surface p-8 text-start">
            <h3 className="text-xl font-semibold text-foreground">
              {hasActiveSearch ? "No results found" : "Start a search"}
            </h3>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-muted">
              {hasActiveSearch
                ? "Try a broader keyword, remove a filter, or browse categories and languages from the homepage."
                : "Use the search field or filters above to find articles and blogs in the directory."}
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link href={href(locale)} className="rounded-md border border-border px-4 py-2 text-sm font-semibold text-foreground">
                Go to homepage
              </Link>
              <Link href={href(locale, "/search")} className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white">
                Clear search
              </Link>
            </div>
          </div>
        ) : (
          <div className="mt-8 grid gap-10">
            {visibleArticles.length > 0 ? (
              <section aria-labelledby="article-results-title">
                <h3 id="article-results-title" className="text-xl font-semibold text-foreground">
                  Articles
                </h3>
                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  {visibleArticles.map((article) => (
                    <article key={article.id} className="rounded-lg border border-border bg-surface p-5 text-start">
                      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-accent">
                        {article.categories[0] ?? ""}
                      </p>
                      <h4 className="mt-2 text-lg font-semibold leading-7 text-foreground">
                        <Link href={href(locale, `/articles/${article.id}`)}>{article.title}</Link>
                      </h4>
                      <p className="mt-3 text-sm leading-6 text-muted">{article.excerpt}</p>
                      <p className="mt-4 text-sm text-muted">
                        {article.blogName ? (
                          <Link href={href(locale, `/blogs/${article.blogSlug}`)} className="font-medium text-primary">
                            {article.blogName}
                          </Link>
                        ) : null}
                        {article.blogName ? " / " : ""}
                        {article.language.toUpperCase()} / {formatDate(article.publishedAt, locale)}
                      </p>
                    </article>
                  ))}
                </div>
              </section>
            ) : null}

            {visibleBlogs.length > 0 ? (
              <section aria-labelledby="blog-results-title">
                <h3 id="blog-results-title" className="text-xl font-semibold text-foreground">
                  Blogs
                </h3>
                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  {visibleBlogs.map((blog) => (
                    <article key={blog.id} className="rounded-lg border border-border bg-surface p-5 text-start">
                      <div className="flex items-start justify-between gap-4">
                        <h4 className="text-lg font-semibold leading-7 text-foreground">
                          <Link href={href(locale, `/blogs/${blog.slug}`)}>{blog.title}</Link>
                        </h4>
                      </div>
                      <p className="mt-3 text-sm leading-6 text-muted">{blog.excerpt}</p>
                      <p className="mt-4 text-sm text-muted">
                        {blog.categories.join(" / ")}
                        {blog.categories.length > 0 ? " / " : ""}
                        {blog.language.toUpperCase()}
                      </p>
                    </article>
                  ))}
                </div>
              </section>
            ) : null}
          </div>
        )}

        {results.length > 0 && totalPages > 1 ? (
          <nav className="mt-10 flex items-center justify-between border-t border-border pt-6" aria-label="Search pagination">
            <Link
              href={searchHref(locale, query, { page: Math.max(1, currentPage - 1) })}
              aria-disabled={currentPage === 1}
              className="rounded-md border border-border px-4 py-2 text-sm font-semibold text-foreground aria-disabled:pointer-events-none aria-disabled:opacity-50"
            >
              Previous
            </Link>
            <p className="text-sm text-muted">
              {currentPage} / {totalPages}
            </p>
            <Link
              href={searchHref(locale, query, { page: Math.min(totalPages, currentPage + 1) })}
              aria-disabled={currentPage === totalPages}
              className="rounded-md border border-border px-4 py-2 text-sm font-semibold text-foreground aria-disabled:pointer-events-none aria-disabled:opacity-50"
            >
              Next
            </Link>
          </nav>
        ) : null}
      </section>
    </main>
  );
}
