import type { Metadata } from "next";
import Link from "next/link";

import { isSupportedLocale, type Locale } from "@/i18n/config";
import { localizedPath, resolveLocale } from "@/i18n/routing";
import { createCanonicalPath } from "@/seo/canonical";
import { createHreflangAlternates } from "@/seo/hreflang";
import { createMetadata } from "@/seo/metadata";
import { JsonLd } from "@/shared/seo/json-ld";
import { fetchBlogs, fetchArticles } from "@/shared/api/data";

export const revalidate = 900;

type CategoryPageProps = {
  params: Promise<{ locale: string; categorySlug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

const pageSize = 4;

function firstValue(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
}

function parsePage(params: Record<string, string | string[] | undefined>): number {
  const rawPage = Number(firstValue(params.page));
  return Number.isFinite(rawPage) && rawPage > 0 ? Math.floor(rawPage) : 1;
}

function slugToName(slug: string): string {
  return slug
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function getInitials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function href(locale: Locale, path = "/") {
  return localizedPath(locale, path);
}

function categoryPageHref(locale: Locale, categorySlug: string, page: number) {
  const basePath = href(locale, `/categories/${categorySlug}`);
  return page > 1 ? `${basePath}?page=${page}` : basePath;
}

function formatDate(value: string | null, locale: Locale): string {
  if (!value) return "";
  return new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(value));
}

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  const { locale: localeParam, categorySlug } = await params;
  const locale = resolveLocale(localeParam);
  const categoryName = slugToName(categorySlug);

  return createMetadata({
    title: `${categoryName} blogs and articles`,
    description: `Browse ${categoryName} blogs and article previews on MillionBlogs.`,
    canonicalPath: createCanonicalPath(locale, `/categories/${categorySlug}`),
    languages: createHreflangAlternates(`/categories/${categorySlug}`),
  });
}

export default async function CategoryPage({ params, searchParams }: CategoryPageProps) {
  const { locale: localeParam, categorySlug } = await params;
  const rawSearchParams = await searchParams;
  const locale = isSupportedLocale(localeParam) ? localeParam : "en";
  const categoryName = slugToName(categorySlug);

  const requestedPage = parsePage(rawSearchParams);

  const [blogsData, articlesData] = await Promise.all([
    fetchBlogs({ categorySlug, pageSize: 50 }),
    fetchArticles({ categorySlug, page, requestedPage, pageSize }),
  ]);

  const blogs = blogsData?.items ?? [];
  const articleItems = articlesData?.items ?? [];
  const totalArticles = articlesData?.total ?? 0;
  const totalPages = Math.max(1, articlesData?.totalPages ?? 1);
  const currentPage = Math.min(requestedPage, totalPages);

  if (blogs.length === 0 && articleItems.length === 0) {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col justify-center gap-5 px-6 py-12 text-start lg:px-8">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-accent">Category</p>
        <h1 className="text-3xl font-semibold text-foreground">Category not found</h1>
        <p className="text-sm leading-6 text-muted">
          This category may not exist yet. Search the directory to find current articles, blogs, and topics.
        </p>
        <Link href={href(locale, "/search")} className="w-fit rounded-md bg-primary px-5 py-3 text-sm font-semibold text-white">
          Search the directory
        </Link>
      </main>
    );
  }

  const collectionJsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: `${categoryName} blogs and articles`,
    description: `Browse ${categoryName} blogs and article previews.`,
    url: href(locale, `/categories/${categorySlug}`),
    inLanguage: locale,
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: totalArticles,
      itemListElement: articleItems.map((article, index) => ({
        "@type": "ListItem",
        position: index + 1,
        url: href(locale, `/articles/${article.id}`),
        name: article.title,
      })),
    },
  };

  return (
    <>
      <JsonLd data={collectionJsonLd} />
      <main className="bg-background text-foreground">
        <section className="border-b border-border bg-surface/50 px-6 py-12 lg:px-8">
          <div className="mx-auto w-full max-w-7xl text-start">
            <nav aria-label="Breadcrumb" className="mb-8 text-sm text-muted">
              <Link href={href(locale)} className="font-medium text-primary">
                Home
              </Link>
              <span aria-hidden="true"> / </span>
              <Link href={href(locale, "/search")} className="font-medium text-primary">
                Search
              </Link>
              <span aria-hidden="true"> / Category</span>
            </nav>

            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-accent">Category</p>
            <h1 className="mt-4 text-4xl font-semibold leading-tight text-foreground md:text-5xl">
              {categoryName} blogs and articles
            </h1>
            <p className="mt-5 max-w-3xl text-lg leading-8 text-muted">
              Independent writing on {categoryName.toLowerCase()}, curated by the MillionBlogs directory.
            </p>
          </div>
        </section>

        <section className="mx-auto grid w-full max-w-7xl gap-10 px-6 py-10 lg:grid-cols-[0.8fr_1.2fr] lg:px-8">
          <aside className="text-start" aria-labelledby="featured-blogs-title">
            <h2 id="featured-blogs-title" className="text-2xl font-semibold text-foreground">
              Blogs in {categoryName}
            </h2>

            {blogs.length === 0 ? (
              <div className="mt-5 rounded-lg border border-border bg-surface p-5">
                <h3 className="text-lg font-semibold text-foreground">No blogs yet</h3>
                <p className="mt-2 text-sm leading-6 text-muted">
                  Blogs will appear here when publishers in this category are verified or curated.
                </p>
              </div>
            ) : (
              <div className="mt-5 grid gap-4">
                {blogs.map((blog) => (
                  <article key={blog.slug} className="rounded-lg border border-border bg-surface p-5">
                    <div className="flex items-start gap-3">
                      <div
                        className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md border border-border bg-background text-sm font-semibold text-primary"
                        aria-hidden="true"
                      >
                        {getInitials(blog.name)}
                      </div>
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-semibold text-foreground">
                            <Link href={href(locale, `/blogs/${blog.slug}`)}>{blog.name}</Link>
                          </h3>
                        </div>
                        <p className="mt-2 text-sm leading-6 text-muted">{blog.description}</p>
                        <p className="mt-3 text-sm text-muted">{blog.primaryLanguage.toUpperCase()}</p>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </aside>

          <section className="text-start" aria-labelledby="category-articles-title">
            <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
              <div>
                <h2 id="category-articles-title" className="text-2xl font-semibold text-foreground">
                  Articles in {categoryName}
                </h2>
                <p className="mt-2 text-sm leading-6 text-muted">
                  {totalArticles === 1 ? "1 article" : `${totalArticles} articles`} indexed in this category.
                </p>
              </div>
              <Link href={href(locale, "/search")} className="text-sm font-semibold text-primary">
                Search all articles
              </Link>
            </div>

            {articleItems.length === 0 ? (
              <div className="mt-5 rounded-lg border border-border bg-surface p-6">
                <h3 className="text-lg font-semibold text-foreground">No articles yet</h3>
                <p className="mt-2 text-sm leading-6 text-muted">
                  Article previews will appear here when blogs in this category are indexed.
                </p>
              </div>
            ) : (
              <div className="mt-5 grid gap-4">
                {articleItems.map((article) => (
                  <article key={article.id} className="rounded-lg border border-border bg-surface p-5">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-accent">{categoryName}</p>
                    <h3 className="mt-2 text-lg font-semibold leading-7 text-foreground">
                      <Link href={href(locale, `/articles/${article.id}`)}>{article.title}</Link>
                    </h3>
                    <p className="mt-3 text-sm leading-6 text-muted">{article.excerpt}</p>
                    <p className="mt-4 text-sm text-muted">
                      {article.blog ? (
                        <Link href={href(locale, `/blogs/${article.blog.slug}`)} className="font-medium text-primary">
                          {article.blog.name}
                        </Link>
                      ) : null}
                      {article.blog ? " / " : ""}
                      {article.language.toUpperCase()} / {formatDate(article.publishedAt, locale)}
                    </p>
                  </article>
                ))}
              </div>
            )}

            {articleItems.length > 0 && totalPages > 1 ? (
              <nav className="mt-8 flex items-center justify-between border-t border-border pt-6" aria-label="Category pagination">
                {currentPage > 1 ? (
                  <Link
                    href={categoryPageHref(locale, categorySlug, currentPage - 1)}
                    className="rounded-md border border-border px-4 py-2 text-sm font-semibold text-foreground"
                  >
                    Previous
                  </Link>
                ) : (
                  <span className="rounded-md border border-border px-4 py-2 text-sm font-semibold text-muted opacity-60">Previous</span>
                )}
                <p className="text-sm text-muted">
                  {currentPage} / {totalPages}
                </p>
                {currentPage < totalPages ? (
                  <Link
                    href={categoryPageHref(locale, categorySlug, currentPage + 1)}
                    className="rounded-md border border-border px-4 py-2 text-sm font-semibold text-foreground"
                  >
                    Next
                  </Link>
                ) : (
                  <span className="rounded-md border border-border px-4 py-2 text-sm font-semibold text-muted opacity-60">Next</span>
                )}
              </nav>
            ) : null}
          </section>
        </section>
      </main>
    </>
  );
}
