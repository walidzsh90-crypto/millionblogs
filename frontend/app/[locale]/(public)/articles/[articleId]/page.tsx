import type { Metadata } from "next";
import Link from "next/link";

import { isSupportedLocale, type Locale } from "@/i18n/config";
import { localizedPath, resolveLocale } from "@/i18n/routing";
import { createCanonicalPath } from "@/seo/canonical";
import { createHreflangAlternates } from "@/seo/hreflang";
import { createMetadata } from "@/seo/metadata";
import { JsonLd } from "@/shared/seo/json-ld";
import { fetchArticleById, fetchArticles } from "@/shared/api/data";

export const revalidate = 900;

type ArticlePageProps = {
  params: Promise<{ locale: string; articleId: string }>;
};

function href(locale: Locale, path = "/") {
  return localizedPath(locale, path);
}

function formatDate(value: string | null, locale: Locale): string {
  if (!value) return "";
  return new Intl.DateTimeFormat(locale, {
    year: "long",
    month: "long",
    day: "numeric",
  }).format(new Date(value));
}

function getBadge(article: NonNullable<Awaited<ReturnType<typeof fetchArticleById>>>): string {
  if (article.blog?.slug) return "Verified";
  return "Imported";
}

export async function generateMetadata({ params }: ArticlePageProps): Promise<Metadata> {
  const { locale: localeParam, articleId } = await params;
  const locale = resolveLocale(localeParam);
  const article = await fetchArticleById(articleId);

  if (!article) {
    return createMetadata({
      title: "Article not found",
      description: "This article preview is not available on MillionBlogs.",
      canonicalPath: createCanonicalPath(locale, `/articles/${articleId}`),
      languages: createHreflangAlternates(`/articles/${articleId}`),
      noIndex: true,
    });
  }

  return createMetadata({
    title: article.title,
    description: article.excerpt ?? `Read ${article.title} on MillionBlogs`,
    canonicalPath: createCanonicalPath(locale, `/articles/${article.id}`),
    languages: createHreflangAlternates(`/articles/${article.id}`),
  });
}

export default async function ArticlePage({ params }: ArticlePageProps) {
  const { locale: localeParam, articleId } = await params;
  const locale = isSupportedLocale(localeParam) ? localeParam : "en";

  const article = await fetchArticleById(articleId);

  if (!article) {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col justify-center gap-5 px-6 py-12 text-start lg:px-8">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-accent">Article preview</p>
        <h1 className="text-3xl font-semibold text-foreground">Article preview not found</h1>
        <p className="text-sm leading-6 text-muted">
          The article may have been removed, renamed, or not imported yet. You can continue exploring current articles
          from the public search page.
        </p>
        <Link href={href(locale, "/search")} className="w-fit rounded-md bg-primary px-5 py-3 text-sm font-semibold text-white">
          Search articles
        </Link>
      </main>
    );
  }

  const relatedData = await fetchArticles({ blogId: article.blogId, pageSize: 4 });
  const relatedArticles = (relatedData?.items ?? []).filter((a) => a.id !== article.id).slice(0, 3);
  const formattedDate = formatDate(article.publishedAt, locale);
  const categoryName = article.categories[0]?.name ?? "";
  const badge = getBadge(article);

  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.title,
    description: article.excerpt,
    datePublished: article.publishedAt,
    inLanguage: article.language,
    isPartOf: article.blog
      ? {
          "@type": "Blog",
          name: article.blog.name,
          url: href(locale, `/blogs/${article.blog.slug}`),
        }
      : undefined,
    mainEntityOfPage: href(locale, `/articles/${article.id}`),
  };

  return (
    <>
      <JsonLd data={articleJsonLd} />
      <main className="bg-background text-foreground">
        <article className="mx-auto w-full max-w-5xl px-6 py-12 text-start lg:px-8">
          <nav aria-label="Breadcrumb" className="mb-8 text-sm text-muted">
            <Link href={href(locale)} className="font-medium text-primary">
              Home
            </Link>
            <span aria-hidden="true"> / </span>
            <Link href={href(locale, "/search")} className="font-medium text-primary">
              Search
            </Link>
            <span aria-hidden="true"> / Article preview</span>
          </nav>

          <header className="border-b border-border pb-8">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-accent">Article preview</p>
            <h1 className="mt-4 text-4xl font-semibold leading-tight text-foreground md:text-5xl">{article.title}</h1>
            {article.excerpt ? (
              <p className="mt-5 max-w-3xl text-lg leading-8 text-muted">{article.excerpt}</p>
            ) : null}
            <dl className="mt-6 grid gap-4 text-sm text-muted sm:grid-cols-3">
              {categoryName ? (
                <div>
                  <dt className="font-semibold text-foreground">Category</dt>
                  <dd className="mt-1">{categoryName}</dd>
                </div>
              ) : null}
              <div>
                <dt className="font-semibold text-foreground">Language</dt>
                <dd className="mt-1">{article.language.toUpperCase()}</dd>
              </div>
              <div>
                <dt className="font-semibold text-foreground">Published</dt>
                <dd className="mt-1">{formattedDate}</dd>
              </div>
            </dl>
          </header>

          <section className="grid gap-6 border-b border-border py-8 md:grid-cols-[1fr_0.8fr]" aria-labelledby="continue-reading-title">
            <div>
              <h2 id="continue-reading-title" className="text-2xl font-semibold text-foreground">
                Continue reading on the original blog
              </h2>
              <p className="mt-3 text-sm leading-6 text-muted">
                MillionBlogs shows previews and discovery metadata. The full article lives on the publisher&apos;s own
                site.
              </p>
              <a
                href={article.canonicalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-5 inline-flex min-h-11 items-center rounded-md bg-primary px-5 py-3 text-sm font-semibold text-white"
              >
                Continue reading
              </a>
            </div>

            {article.blog ? (
              <aside className="rounded-lg border border-border bg-surface p-5" aria-labelledby="blog-info-title">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 id="blog-info-title" className="text-xl font-semibold text-foreground">
                      <Link href={href(locale, `/blogs/${article.blog.slug}`)}>{article.blog.name}</Link>
                    </h2>
                    <p className="mt-2 text-sm leading-6 text-muted">Source blog on MillionBlogs.</p>
                  </div>
                  <span className="rounded-sm bg-success/10 px-2 py-1 text-xs font-semibold text-success">{badge}</span>
                </div>
                <dl className="mt-5 grid gap-3 text-sm text-muted">
                  <div className="flex items-center justify-between gap-4">
                    <dt>Blog language</dt>
                    <dd className="font-medium text-foreground">{article.language.toUpperCase()}</dd>
                  </div>
                  {categoryName ? (
                    <div className="flex items-center justify-between gap-4">
                      <dt>Source category</dt>
                      <dd className="font-medium text-foreground">{categoryName}</dd>
                    </div>
                  ) : null}
                </dl>
              </aside>
            ) : null}
          </section>

          <section className="py-8" aria-labelledby="related-articles-title">
            <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
              <div>
                <h2 id="related-articles-title" className="text-2xl font-semibold text-foreground">
                  Related articles
                </h2>
                <p className="mt-2 text-sm leading-6 text-muted">More previews from the same blog.</p>
              </div>
              <Link href={href(locale, "/search")} className="text-sm font-semibold text-primary">
                Search more articles
              </Link>
            </div>

            {relatedArticles.length === 0 ? (
              <div className="mt-6 rounded-lg border border-border bg-surface p-6">
                <h3 className="text-lg font-semibold text-foreground">No related articles yet</h3>
                <p className="mt-2 text-sm leading-6 text-muted">
                  Related content will appear here as more articles are imported into MillionBlogs.
                </p>
              </div>
            ) : (
              <div className="mt-6 grid gap-4 md:grid-cols-3">
                {relatedArticles.map((relatedArticle) => (
                  <article key={relatedArticle.id} className="rounded-lg border border-border bg-surface p-5">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-accent">
                      {relatedArticle.categories[0]?.name ?? ""}
                    </p>
                    <h3 className="mt-2 text-lg font-semibold leading-7 text-foreground">
                      <Link href={href(locale, `/articles/${relatedArticle.id}`)}>{relatedArticle.title}</Link>
                    </h3>
                    <p className="mt-3 text-sm leading-6 text-muted">{relatedArticle.excerpt}</p>
                    <p className="mt-4 text-sm text-muted">
                      {relatedArticle.blog?.name ?? ""} / {relatedArticle.language.toUpperCase()}
                    </p>
                  </article>
                ))}
              </div>
            )}
          </section>
        </article>
      </main>
    </>
  );
}
