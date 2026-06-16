import type { Metadata } from "next";
import Link from "next/link";

import { isSupportedLocale, type Locale } from "@/i18n/config";
import { localizedPath, resolveLocale } from "@/i18n/routing";
import { createCanonicalPath } from "@/seo/canonical";
import { createHreflangAlternates } from "@/seo/hreflang";
import { createMetadata } from "@/seo/metadata";
import { JsonLd } from "@/shared/seo/json-ld";
import { SiteFooter } from "@/shared/components/layout/site-footer";
import { fetchBlogs, fetchArticles, fetchBlogStats, extractCategories, extractLanguages } from "@/shared/api/data";
import type { BlogDto, ArticleDto } from "@/shared/api/types";

export const revalidate = 900;

type HomePageProps = {
  params: Promise<{ locale: string }>;
};

function href(locale: Locale, path = "/") {
  return localizedPath(locale, path);
}

function badgeColor(badge: string) {
  if (badge === "verified") return "border-success/20 bg-success/10 text-success";
  if (badge === "featured") return "border-accent/20 bg-accent/10 text-accent";
  if (badge === "trusted") return "border-primary/20 bg-primary/10 text-primary";
  return "border-muted/30 bg-muted/20 text-muted";
}

function formatTrustStatus(status: string): string {
  switch (status) {
    case "verified": return "Verified";
    case "trusted": return "Trusted";
    case "featured": return "Featured";
    default: return "New";
  }
}

export async function generateMetadata({ params }: HomePageProps): Promise<Metadata> {
  const { locale: localeParam } = await params;
  const locale = resolveLocale(localeParam);

  return createMetadata({
    title: "MillionBlogs",
    description: "Discover independent blogs, fresh articles, categories, and languages from one SEO-first directory.",
    canonicalPath: createCanonicalPath(locale),
    languages: createHreflangAlternates("/"),
  });
}

export default async function HomePage({ params }: HomePageProps) {
  const { locale: localeParam } = await params;
  const locale = isSupportedLocale(localeParam) ? localeParam : "en";

  const [blogsResult, articlesResult, stats] = await Promise.all([
    fetchBlogs({ pageSize: 9 }),
    fetchArticles({ pageSize: 6 }),
    fetchBlogStats(),
  ]);

  const featuredBlogs: BlogDto[] = blogsResult?.items ?? [];
  const latestArticles: ArticleDto[] = articlesResult?.items ?? [];
  const categories = await extractCategories(featuredBlogs.length > 0 ? featuredBlogs : null);
  const languages = await extractLanguages(latestArticles.length > 0 ? latestArticles : null);

  const totalBlogs = stats ? stats.verified + stats.pendingVerification + stats.draft : undefined;

  const websiteJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "MillionBlogs",
    url: href(locale),
    potentialAction: {
      "@type": "SearchAction",
      target: `${href(locale, "/search")}?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };

  return (
    <>
      <JsonLd data={websiteJsonLd} />
      <main className="bg-background text-foreground">
        <section className="relative overflow-hidden border-b border-border">
          <div className="mx-auto grid min-h-[82vh] w-full max-w-7xl items-center gap-10 px-6 py-16 md:grid-cols-[1.05fr_0.95fr] lg:px-8">
            <div className="text-start">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-accent">MillionBlogs directory</p>
              <h1 className="mt-5 max-w-4xl text-4xl font-semibold leading-tight tracking-normal text-foreground md:text-6xl">
                Discover useful blogs before the algorithm buries them.
              </h1>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-muted">
                Browse independent publishers, fresh articles, trusted badges, categories, and languages from a single
                multilingual discovery hub.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  href={href(locale, "/blogs")}
                  className="inline-flex min-h-11 items-center justify-center rounded-md bg-primary px-5 py-3 text-sm font-semibold text-white"
                >
                  Explore blogs
                </Link>
                <Link
                  href={href(locale, "/pricing")}
                  className="inline-flex min-h-11 items-center justify-center rounded-md border border-border px-5 py-3 text-sm font-semibold text-foreground"
                >
                  Add your blog
                </Link>
              </div>
            </div>

            <div className="rounded-lg border border-border bg-surface p-5 shadow-raised" aria-label="Directory preview">
              <div className="flex items-center justify-between border-b border-border pb-4">
                <div>
                  <p className="text-sm font-semibold text-foreground">Live discovery</p>
                  <p className="text-sm text-muted">
                    {totalBlogs !== undefined
                      ? `${totalBlogs} blogs indexed`
                      : "Blogs, articles, and languages in one index"}
                  </p>
                </div>
                <span className="rounded-sm bg-success/10 px-2 py-1 text-xs font-semibold text-success">Fresh</span>
              </div>
              <div className="grid gap-3 pt-4">
                {categories.length > 0
                  ? categories.slice(0, 3).map((cat) => (
                      <div key={cat.slug} className="rounded-md border border-border bg-background p-4">
                        <div className="flex items-center justify-between gap-4">
                          <p className="font-medium text-foreground">{cat.name}</p>
                          <p className="text-sm text-muted">Active</p>
                        </div>
                        <div className="mt-3 h-2 rounded-sm bg-muted/20">
                          <div className="h-2 rounded-sm bg-primary" style={{ width: "60%" }} />
                        </div>
                      </div>
                    ))
                  : ["Technology", "Food", "Publishing"].map((item, index) => (
                      <div key={item} className="rounded-md border border-border bg-background p-4">
                        <div className="flex items-center justify-between gap-4">
                          <p className="font-medium text-foreground">{item}</p>
                          <p className="text-sm text-muted">{index + 7} new reads</p>
                        </div>
                        <div className="mt-3 h-2 rounded-sm bg-muted/20">
                          <div className="h-2 rounded-sm bg-primary" style={{ width: `${72 - index * 12}%` }} />
                        </div>
                      </div>
                    ))}
              </div>
            </div>
          </div>
        </section>

        <section className="border-b border-border bg-surface/50 px-6 py-8 lg:px-8" aria-labelledby="home-search-title">
          <div className="mx-auto flex w-full max-w-5xl flex-col gap-4 md:flex-row md:items-end">
            <div className="flex-1 text-start">
              <h2 id="home-search-title" className="text-2xl font-semibold text-foreground">
                Search the directory
              </h2>
              <p className="mt-2 text-sm leading-6 text-muted">Find articles, blogs, categories, and languages.</p>
            </div>
            <form action={href(locale, "/search")} className="flex flex-1 flex-col gap-3 sm:flex-row" role="search">
              <label className="sr-only" htmlFor="homepage-search">
                Search MillionBlogs
              </label>
              <input
                id="homepage-search"
                name="q"
                type="search"
                placeholder="Search blogs or articles"
                className="min-h-11 flex-1 rounded-md border border-border bg-background px-4 text-base text-foreground placeholder:text-muted"
              />
              <button type="submit" className="min-h-11 rounded-md bg-primary px-5 text-sm font-semibold text-white">
                Search
              </button>
            </form>
          </div>
        </section>

        {featuredBlogs.length > 0 && (
          <section className="mx-auto w-full max-w-7xl px-6 py-14 lg:px-8" aria-labelledby="featured-blogs-title">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
              <div className="text-start">
                <h2 id="featured-blogs-title" className="text-3xl font-semibold text-foreground">
                  Featured blogs
                </h2>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
                  Publishers in the MillionBlogs directory.
                </p>
              </div>
              <Link href={href(locale, "/blogs")} className="text-sm font-semibold text-primary">
                View all blogs
              </Link>
            </div>
            <div className="mt-8 grid gap-4 md:grid-cols-3">
              {featuredBlogs.map((blog) => (
                <Link key={blog.id} href={href(locale, `/blogs/${blog.slug}`)} className="group rounded-lg border border-border bg-surface p-5 text-start transition-colors hover:border-primary/50">
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="text-lg font-semibold text-foreground group-hover:text-primary">{blog.name}</h3>
                    {blog.trustStatus && blog.trustStatus !== "new" && (
                      <span className={`rounded-sm border px-2 py-1 text-xs font-semibold ${badgeColor(blog.trustStatus)}`}>
                        {formatTrustStatus(blog.trustStatus)}
                      </span>
                    )}
                  </div>
                  <p className="mt-3 text-sm leading-6 text-muted line-clamp-2">{blog.description}</p>
                  <p className="mt-5 text-sm text-muted">
                    {blog.categories.slice(0, 2).map((c) => c.name).join(", ") || "Uncategorized"}
                    {blog.primaryLanguage ? ` / ${blog.primaryLanguage}` : ""}
                  </p>
                </Link>
              ))}
            </div>
          </section>
        )}

        {latestArticles.length > 0 && (
          <section className="border-y border-border bg-surface/50">
            <div className="mx-auto grid w-full max-w-7xl gap-10 px-6 py-14 lg:grid-cols-2 lg:px-8">
              <section aria-labelledby="latest-articles-title" className="text-start">
                <h2 id="latest-articles-title" className="text-3xl font-semibold text-foreground">
                  Latest articles
                </h2>
                <div className="mt-6 grid gap-3">
                  {latestArticles.map((article) => (
                    <Link key={article.id} href={href(locale, `/articles/${article.id}`)} className="block rounded-lg border border-border bg-background p-5 transition-colors hover:border-primary/50">
                      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-accent">
                        {article.categories[0]?.name || "General"}
                      </p>
                      <h3 className="mt-2 text-lg font-semibold leading-7 text-foreground">{article.title}</h3>
                      <p className="mt-3 text-sm text-muted">
                        {article.blog?.name ?? "Unknown blog"}
                        {article.publishedAt ? ` / ${new Date(article.publishedAt).toLocaleDateString()}` : ""}
                      </p>
                    </Link>
                  ))}
                </div>
              </section>

              <section aria-labelledby="trending-articles-title" className="text-start">
                <h2 id="trending-articles-title" className="text-3xl font-semibold text-foreground">
                  Trending articles
                </h2>
                <div className="mt-6 grid gap-3">
                  {[...latestArticles]
                    .sort((a, b) => (b.viewCount ?? 0) - (a.viewCount ?? 0))
                    .slice(0, 3)
                    .map((article, index) => (
                      <Link key={article.id} href={href(locale, `/articles/${article.id}`)} className="block rounded-lg border border-border bg-background p-5 transition-colors hover:border-primary/50">
                        <p className="text-sm font-semibold text-primary">
                          #{index + 1} {article.viewCount > 50 ? "Popular" : "Trending"}
                        </p>
                        <h3 className="mt-2 text-lg font-semibold leading-7 text-foreground">{article.title}</h3>
                        <p className="mt-3 text-sm text-muted">{article.blog?.name ?? "Unknown blog"}</p>
                      </Link>
                    ))}
                </div>
              </section>
            </div>
          </section>
        )}

        <section className="mx-auto grid w-full max-w-7xl gap-10 px-6 py-14 lg:grid-cols-[1fr_0.85fr] lg:px-8">
          <section aria-labelledby="categories-title" className="text-start">
            <h2 id="categories-title" className="text-3xl font-semibold text-foreground">
              Browse by category
            </h2>
            <p className="mt-2 text-sm leading-6 text-muted">Topical paths for readers who know what they want.</p>
            <div className="mt-6 flex flex-wrap gap-3">
              {categories.length > 0
                ? categories.map((cat) => (
                    <Link
                      key={cat.slug}
                      href={href(locale, `/categories/${cat.slug}`)}
                      className="rounded-md border border-border bg-surface px-4 py-3 text-sm font-medium text-foreground"
                    >
                      {cat.name}
                    </Link>
                  ))
                : ["Technology", "Food", "Travel", "Business", "Culture", "Health", "Education", "Design"].map((cat) => (
                    <span
                      key={cat}
                      className="rounded-md border border-border bg-surface px-4 py-3 text-sm font-medium text-muted"
                    >
                      {cat}
                    </span>
                  ))}
            </div>
          </section>

          <section aria-labelledby="languages-title" className="text-start">
            <h2 id="languages-title" className="text-3xl font-semibold text-foreground">
              Browse by language
            </h2>
            <p className="mt-2 text-sm leading-6 text-muted">A multilingual index with LTR and RTL-ready navigation.</p>
            <div className="mt-6 grid gap-3">
              {languages.length > 0
                ? languages.map((lang) => (
                    <Link
                      key={lang}
                      href={href(locale, `/languages/${lang}`)}
                      className="flex items-center justify-between rounded-lg border border-border bg-surface p-4 text-sm font-medium text-foreground"
                    >
                      <span>{lang}</span>
                    </Link>
                  ))
                : [
                    { name: "English", code: "en" },
                    { name: "Arabic", code: "ar" },
                    { name: "Dutch", code: "nl" },
                  ].map((lang) => (
                    <Link
                      key={lang.code}
                      href={href(locale, `/languages/${lang.code}`)}
                      className="flex items-center justify-between rounded-lg border border-border bg-surface p-4 text-sm font-medium text-foreground"
                    >
                      <span>{lang.name}</span>
                      <span className="text-muted">{lang.code === "ar" ? "RTL" : "LTR"}</span>
                    </Link>
                  ))}
            </div>
          </section>
        </section>

        <section className="border-y border-border bg-primary text-white" aria-labelledby="blogger-cta-title">
          <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-6 py-12 text-start md:flex-row md:items-center md:justify-between lg:px-8">
            <div>
              <h2 id="blogger-cta-title" className="text-3xl font-semibold">
                Bring your blog into the directory.
              </h2>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-white/85">
                Register your blog, connect a feed, earn trust badges, and reach readers browsing by topic and language.
              </p>
            </div>
            <Link
              href={href(locale, "/auth/register")}
              className="inline-flex min-h-11 items-center justify-center rounded-md bg-white px-5 py-3 text-sm font-semibold text-primary"
            >
              Register your blog
            </Link>
          </div>
        </section>
      </main>

      <SiteFooter locale={locale} />
    </>
  );
}
