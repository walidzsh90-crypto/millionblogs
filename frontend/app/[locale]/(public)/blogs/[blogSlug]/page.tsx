import type { Metadata } from "next";
import Link from "next/link";

import { isSupportedLocale, type Locale } from "@/i18n/config";
import { localizedPath, resolveLocale } from "@/i18n/routing";
import { createCanonicalPath } from "@/seo/canonical";
import { createHreflangAlternates } from "@/seo/hreflang";
import { createMetadata } from "@/seo/metadata";
import { JsonLd } from "@/shared/seo/json-ld";
import { fetchBlogBySlug, fetchArticles, fetchBlogs } from "@/shared/api/data";
import type { BlogDto, ArticleDto } from "@/shared/api/types";

export const revalidate = 900;

type BlogPageProps = {
  params: Promise<{ locale: string; blogSlug: string }>;
};

function href(locale: Locale, path = "/") {
  return localizedPath(locale, path);
}

function formatDate(value: string | null, locale: Locale): string {
  if (!value) return "";
  return new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(value));
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

function getBadges(blog: BlogDto): string[] {
  const badges: string[] = [];
  if (blog.trustStatus === "featured") badges.push("Featured");
  if (blog.trustStatus === "verified" || blog.trustStatus === "trusted") badges.push("Verified");
  if (blog.verifiedAt) badges.push("Verified");
  return badges;
}

function getVerificationLabel(blog: BlogDto): string {
  if (blog.verifiedAt || blog.trustStatus === "verified" || blog.trustStatus === "trusted" || blog.trustStatus === "featured") return "Verified";
  if (blog.trustStatus === "new") return "Verification pending";
  return "Unverified";
}

function getVerificationStatus(blog: BlogDto): "verified" | "pending" | "unverified" {
  if (blog.verifiedAt || blog.trustStatus === "verified" || blog.trustStatus === "trusted" || blog.trustStatus === "featured") return "verified";
  if (blog.trustStatus === "new") return "pending";
  return "unverified";
}

export async function generateMetadata({ params }: BlogPageProps): Promise<Metadata> {
  const { locale: localeParam, blogSlug } = await params;
  const locale = resolveLocale(localeParam);
  const blog = await fetchBlogBySlug(blogSlug);

  if (!blog) {
    return createMetadata({
      title: "Blog not found",
      description: "This blog profile is not available on MillionBlogs.",
      canonicalPath: createCanonicalPath(locale, `/blogs/${blogSlug}`),
      languages: createHreflangAlternates(`/blogs/${blogSlug}`),
      noIndex: true,
    });
  }

  return createMetadata({
    title: blog.name,
    description: blog.description ?? `Read articles from ${blog.name}`,
    canonicalPath: createCanonicalPath(locale, `/blogs/${blog.slug}`),
    languages: createHreflangAlternates(`/blogs/${blog.slug}`),
  });
}

export default async function BlogPage({ params }: BlogPageProps) {
  const { locale: localeParam, blogSlug } = await params;
  const locale = isSupportedLocale(localeParam) ? localeParam : "en";

  const blog = await fetchBlogBySlug(blogSlug);

  if (!blog) {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col justify-center gap-5 px-6 py-12 text-start lg:px-8">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-accent">Blog profile</p>
        <h1 className="text-3xl font-semibold text-foreground">Blog profile not found</h1>
        <p className="text-sm leading-6 text-muted">
          The blog may have been removed, renamed, or not registered yet. You can search the directory for current
          blogs and articles.
        </p>
        <Link href={href(locale, "/search")} className="w-fit rounded-md bg-primary px-5 py-3 text-sm font-semibold text-white">
          Search blogs
        </Link>
      </main>
    );
  }

  const [blogArticles, relatedBlogsData] = await Promise.all([
    fetchArticles({ blogId: blog.id, pageSize: 10 }),
    blog.categories.length > 0
      ? fetchBlogs({ categorySlug: blog.categories[0].slug, pageSize: 4 })
      : Promise.resolve(null),
  ]);

  const latestArticles = blogArticles?.items ?? [];
  const relatedBlogs = (relatedBlogsData?.items ?? []).filter((b) => b.slug !== blog.slug);
  const initials = getInitials(blog.name);
  const badges = getBadges(blog);
  const verificationStatus = getVerificationStatus(blog);
  const verificationLabel = getVerificationLabel(blog);

  const blogJsonLd = {
    "@context": "https://schema.org",
    "@type": "Blog",
    name: blog.name,
    description: blog.description,
    url: href(locale, `/blogs/${blog.slug}`),
    inLanguage: blog.primaryLanguage,
    sameAs: blog.url,
  };

  return (
    <>
      <JsonLd data={blogJsonLd} />
      <main className="bg-background text-foreground">
        <section className="border-b border-border bg-surface/50 px-6 py-12 lg:px-8">
          <div className="mx-auto w-full max-w-7xl">
            <nav aria-label="Breadcrumb" className="mb-8 text-sm text-muted">
              <Link href={href(locale)} className="font-medium text-primary">
                Home
              </Link>
              <span aria-hidden="true"> / </span>
              <Link href={href(locale, "/search")} className="font-medium text-primary">
                Search
              </Link>
              <span aria-hidden="true"> / Blog profile</span>
            </nav>

            <div className="grid gap-6 md:grid-cols-[auto_1fr] md:items-center">
              <div
                className="flex h-24 w-24 items-center justify-center rounded-lg border border-border bg-background text-3xl font-semibold text-primary shadow-raised"
                aria-label={`${blog.name} avatar`}
              >
                {initials}
              </div>

              <header className="text-start">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-sm bg-success/10 px-2 py-1 text-xs font-semibold text-success">
                    {verificationLabel}
                  </span>
                  {badges.map((badge) => (
                    <span key={badge} className="rounded-sm bg-promotion/10 px-2 py-1 text-xs font-semibold text-promotion">
                      {badge}
                    </span>
                  ))}
                </div>
                <h1 className="mt-4 text-4xl font-semibold leading-tight text-foreground md:text-5xl">{blog.name}</h1>
                <p className="mt-4 max-w-3xl text-lg leading-8 text-muted">{blog.description}</p>
                <dl className="mt-6 grid gap-4 text-sm text-muted sm:grid-cols-2 lg:grid-cols-3">
                  <div>
                    <dt className="font-semibold text-foreground">Language</dt>
                    <dd className="mt-1">{blog.primaryLanguage.toUpperCase()}</dd>
                  </div>
                  <div>
                    <dt className="font-semibold text-foreground">Verification</dt>
                    <dd className="mt-1">{verificationLabel}</dd>
                  </div>
                  <div>
                    <dt className="font-semibold text-foreground">Categories</dt>
                    <dd className="mt-1">{blog.categories.length}</dd>
                  </div>
                </dl>
                <a
                  href={blog.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-6 inline-flex min-h-11 items-center rounded-md bg-primary px-5 py-3 text-sm font-semibold text-white"
                >
                  Visit website
                </a>
              </header>
            </div>
          </div>
        </section>

        <section className="mx-auto grid w-full max-w-7xl gap-10 px-6 py-10 lg:grid-cols-[0.75fr_1.25fr] lg:px-8">
          <aside className="text-start" aria-labelledby="blog-categories-title">
            <h2 id="blog-categories-title" className="text-2xl font-semibold text-foreground">
              Categories
            </h2>
            {blog.categories.length === 0 ? (
              <div className="mt-5 rounded-lg border border-border bg-surface p-5">
                <h3 className="text-lg font-semibold text-foreground">No categories yet</h3>
                <p className="mt-2 text-sm leading-6 text-muted">Categories will appear when the blog is indexed.</p>
              </div>
            ) : (
              <div className="mt-5 flex flex-wrap gap-3">
                {blog.categories.map((category) => (
                  <Link
                    key={category.slug}
                    href={href(locale, `/categories/${category.slug}`)}
                    className="rounded-md border border-border bg-surface px-4 py-3 text-sm font-medium text-foreground"
                  >
                    {category.name}
                  </Link>
                ))}
              </div>
            )}

            <section className="mt-10 rounded-lg border border-border bg-surface p-5" aria-labelledby="blog-summary-title">
              <h2 id="blog-summary-title" className="text-xl font-semibold text-foreground">
                Blog information
              </h2>
              <dl className="mt-5 grid gap-3 text-sm text-muted">
                <div className="flex items-center justify-between gap-4">
                  <dt>Language</dt>
                  <dd className="font-medium text-foreground">{blog.primaryLanguage.toUpperCase()}</dd>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <dt>Status</dt>
                  <dd className="font-medium text-foreground">{verificationLabel}</dd>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <dt>Badges</dt>
                  <dd className="font-medium text-foreground">{badges.length || "None"}</dd>
                </div>
              </dl>
            </section>
          </aside>

          <div className="grid gap-10">
            <ArticleList
              title="Latest articles"
              articles={latestArticles}
              locale={locale}
              blogSlug={blog.slug}
              emptyLabel="No latest articles yet"
            />
          </div>
        </section>

        <section className="border-t border-border bg-surface/50 px-6 py-10 lg:px-8" aria-labelledby="related-blogs-title">
          <div className="mx-auto w-full max-w-7xl text-start">
            <h2 id="related-blogs-title" className="text-2xl font-semibold text-foreground">
              Related blogs
            </h2>
            <p className="mt-2 text-sm leading-6 text-muted">More publishers with overlapping categories and readers.</p>

            {relatedBlogs.length === 0 ? (
              <div className="mt-6 rounded-lg border border-border bg-background p-6">
                <h3 className="text-lg font-semibold text-foreground">No related blogs yet</h3>
                <p className="mt-2 text-sm leading-6 text-muted">Related blog recommendations will appear as the directory grows.</p>
              </div>
            ) : (
              <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {relatedBlogs.map((relatedBlog) => (
                  <article key={relatedBlog.slug} className="rounded-lg border border-border bg-background p-5">
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-md border border-border bg-surface text-sm font-semibold text-primary">
                        {getInitials(relatedBlog.name)}
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground">
                          <Link href={href(locale, `/blogs/${relatedBlog.slug}`)}>{relatedBlog.name}</Link>
                        </h3>
                        <p className="mt-1 text-xs text-muted">{relatedBlog.primaryLanguage.toUpperCase()}</p>
                      </div>
                    </div>
                    <p className="mt-4 text-sm leading-6 text-muted">{relatedBlog.description}</p>
                  </article>
                ))}
              </div>
            )}
          </div>
        </section>
      </main>
    </>
  );
}

function ArticleList({
  title,
  articles,
  locale,
  blogSlug,
  emptyLabel,
}: {
  title: string;
  articles: ArticleDto[];
  locale: Locale;
  blogSlug: string;
  emptyLabel: string;
}) {
  return (
    <section className="text-start" aria-labelledby={`${title.toLowerCase().replaceAll(" ", "-")}-title`}>
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <h2 id={`${title.toLowerCase().replaceAll(" ", "-")}-title`} className="text-2xl font-semibold text-foreground">
            {title}
          </h2>
          <p className="mt-2 text-sm leading-6 text-muted">Preview links from this blog profile.</p>
        </div>
      </div>

      {articles.length === 0 ? (
        <div className="mt-5 rounded-lg border border-border bg-surface p-5">
          <h3 className="text-lg font-semibold text-foreground">{emptyLabel}</h3>
          <p className="mt-2 text-sm leading-6 text-muted">Articles will appear here after the feed is indexed.</p>
        </div>
      ) : (
        <div className="mt-5 grid gap-4">
          {articles.map((article) => (
            <article key={article.id} className="rounded-lg border border-border bg-surface p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-accent">
                {article.categories[0]?.name ?? ""}
              </p>
              <h3 className="mt-2 text-lg font-semibold leading-7 text-foreground">
                <Link href={href(locale, `/articles/${article.id}`)}>{article.title}</Link>
              </h3>
              <p className="mt-3 text-sm leading-6 text-muted">{article.excerpt}</p>
              <p className="mt-4 text-sm text-muted">
                {formatDate(article.publishedAt, locale)} / {article.language.toUpperCase()}
              </p>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
