import type { Metadata } from "next";
import Link from "next/link";

import { getDirection, isSupportedLocale, supportedLocales, type Locale } from "@/i18n/config";
import { localizedPath, resolveLocale } from "@/i18n/routing";
import { createCanonicalPath } from "@/seo/canonical";
import { createHreflangAlternates } from "@/seo/hreflang";
import { createMetadata } from "@/seo/metadata";
import { JsonLd } from "@/shared/seo/json-ld";
import { fetchBlogs, fetchArticles } from "@/shared/api/data";
import type { BlogDto } from "@/shared/api/types";

export const revalidate = 900;

type LanguagePageProps = {
  params: Promise<{ locale: string; languageCode: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

const pageSize = 4;

const languageNames: Record<string, { name: string; nativeName: string }> = {
  en: { name: "English", nativeName: "English" },
  ar: { name: "Arabic", nativeName: "العربية" },
  nl: { name: "Dutch", nativeName: "Nederlands" },
  es: { name: "Spanish", nativeName: "Español" },
  fr: { name: "French", nativeName: "Français" },
  de: { name: "German", nativeName: "Deutsch" },
  pt: { name: "Portuguese", nativeName: "Português" },
  it: { name: "Italian", nativeName: "Italiano" },
  ru: { name: "Russian", nativeName: "Русский" },
  ja: { name: "Japanese", nativeName: "日本語" },
  ko: { name: "Korean", nativeName: "한국어" },
  zh: { name: "Chinese", nativeName: "中文" },
  hi: { name: "Hindi", nativeName: "हिन्दी" },
  tr: { name: "Turkish", nativeName: "Türkçe" },
  pl: { name: "Polish", nativeName: "Polski" },
  sv: { name: "Swedish", nativeName: "Svenska" },
  da: { name: "Danish", nativeName: "Dansk" },
  fi: { name: "Finnish", nativeName: "Suomi" },
  nb: { name: "Norwegian", nativeName: "Norsk" },
  cs: { name: "Czech", nativeName: "Čeština" },
  hu: { name: "Hungarian", nativeName: "Magyar" },
  ro: { name: "Romanian", nativeName: "Română" },
  uk: { name: "Ukrainian", nativeName: "Українська" },
  el: { name: "Greek", nativeName: "Ελληνικά" },
  he: { name: "Hebrew", nativeName: "עברית" },
  th: { name: "Thai", nativeName: "ไทย" },
  vi: { name: "Vietnamese", nativeName: "Tiếng Việt" },
};

function getLanguageInfo(code: string): { name: string; nativeName: string } | null {
  const lang = languageNames[code.toLowerCase()];
  return lang ?? null;
}

function isValidLanguage(code: string): boolean {
  return (supportedLocales as readonly string[]).includes(code.toLowerCase()) || !!languageNames[code.toLowerCase()];
}

function firstValue(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
}

function parsePage(params: Record<string, string | string[] | undefined>): number {
  const rawPage = Number(firstValue(params.page));
  return Number.isFinite(rawPage) && rawPage > 0 ? Math.floor(rawPage) : 1;
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

function languagePageHref(locale: Locale, languageCode: string, page: number) {
  const basePath = href(locale, `/languages/${languageCode}`);
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

function extractPopularCategories(blogs: BlogDto[], articles: NonNullable<Awaited<ReturnType<typeof fetchArticles>>>["items"]): { slug: string; name: string; count: number }[] {
  const counts = new Map<string, { slug: string; name: string; count: number }>();
  for (const blog of blogs) {
    for (const cat of blog.categories) {
      const existing = counts.get(cat.slug);
      if (existing) {
        existing.count++;
      } else {
        counts.set(cat.slug, { slug: cat.slug, name: cat.name, count: 1 });
      }
    }
  }
  for (const article of articles) {
    for (const cat of article.categories) {
      const existing = counts.get(cat.slug);
      if (existing) {
        existing.count++;
      } else {
        counts.set(cat.slug, { slug: cat.slug, name: cat.name, count: 1 });
      }
    }
  }
  return Array.from(counts.values()).sort((a, b) => b.count - a.count).slice(0, 10);
}

export async function generateMetadata({ params }: LanguagePageProps): Promise<Metadata> {
  const { locale: localeParam, languageCode } = await params;
  const locale = resolveLocale(localeParam);
  const language = getLanguageInfo(languageCode);

  if (!language) {
    return createMetadata({
      title: "Language not found",
      description: "This language page is not available on MillionBlogs.",
      canonicalPath: createCanonicalPath(locale, `/languages/${languageCode}`),
      languages: createHreflangAlternates(`/languages/${languageCode}`),
      noIndex: true,
    });
  }

  return createMetadata({
    title: `${language.name} blogs and articles`,
    description: `Discover ${language.name}-language blogs and article previews from independent publishers.`,
    canonicalPath: createCanonicalPath(locale, `/languages/${languageCode}`),
    languages: createHreflangAlternates(`/languages/${languageCode}`),
  });
}

export default async function LanguagePage({ params, searchParams }: LanguagePageProps) {
  const { locale: localeParam, languageCode } = await params;
  const rawSearchParams = await searchParams;
  const locale = isSupportedLocale(localeParam) ? localeParam : "en";
  const language = getLanguageInfo(languageCode);

  if (!language) {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col justify-center gap-5 px-6 py-12 text-start lg:px-8">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-accent">Language</p>
        <h1 className="text-3xl font-semibold text-foreground">Language page not found</h1>
        <p className="text-sm leading-6 text-muted">
          This language is not available yet. Search the directory to discover current articles, blogs, and topics.
        </p>
        <Link href={href(locale, "/search")} className="w-fit rounded-md bg-primary px-5 py-3 text-sm font-semibold text-white">
          Search the directory
        </Link>
      </main>
    );
  }

  const requestedPage = parsePage(rawSearchParams);

  const [blogsData, articlesData] = await Promise.all([
    fetchBlogs({ language: languageCode, pageSize: 50 }),
    fetchArticles({ language: languageCode, page: requestedPage, pageSize }),
  ]);

  const blogs = blogsData?.items ?? [];
  const articleItems = articlesData?.items ?? [];
  const totalArticles = articlesData?.total ?? 0;
  const totalPages = Math.max(1, articlesData?.totalPages ?? 1);
  const currentPage = Math.min(requestedPage, totalPages);
  const languageDirection = getDirection(languageCode as Locale);
  const popularCategories = extractPopularCategories(blogs, articleItems);

  const collectionJsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: `${language.name} blogs and articles`,
    description: `Discover ${language.name}-language blogs and articles.`,
    url: href(locale, `/languages/${languageCode}`),
    inLanguage: languageCode,
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
              <span aria-hidden="true"> / Language</span>
            </nav>

            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-accent">Language</p>
            <h1 className="mt-4 text-4xl font-semibold leading-tight text-foreground md:text-5xl">
              {language.name} blogs and articles
            </h1>
            <p className="mt-3 text-xl font-semibold text-primary" dir={languageDirection} lang={languageCode}>
              {language.nativeName}
            </p>
            <p className="mt-5 max-w-3xl text-lg leading-8 text-muted">
              Discover {language.name}-language blogs and article previews from independent publishers.
            </p>
          </div>
        </section>

        <section className="mx-auto grid w-full max-w-7xl gap-10 px-6 py-10 lg:grid-cols-[0.8fr_1.2fr] lg:px-8">
          <aside className="grid gap-10 text-start">
            <section aria-labelledby="featured-language-blogs-title">
              <h2 id="featured-language-blogs-title" className="text-2xl font-semibold text-foreground">
                Blogs in {language.name}
              </h2>

              {blogs.length === 0 ? (
                <div className="mt-5 rounded-lg border border-border bg-surface p-5">
                  <h3 className="text-lg font-semibold text-foreground">No blogs yet</h3>
                  <p className="mt-2 text-sm leading-6 text-muted">
                    Blogs will appear here when publishers in this language are verified or curated.
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
                          <p className="mt-3 text-sm text-muted">
                            {blog.categories.map((c) => c.name).join(" / ")}
                          </p>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </section>

            {popularCategories.length > 0 ? (
              <section aria-labelledby="popular-language-categories-title">
                <h2 id="popular-language-categories-title" className="text-2xl font-semibold text-foreground">
                  Popular categories
                </h2>
                <div className="mt-5 flex flex-wrap gap-3">
                  {popularCategories.map((category) => (
                    <Link
                      key={category.slug}
                      href={href(locale, `/categories/${category.slug}`)}
                      className="rounded-md border border-border bg-surface px-4 py-3 text-sm font-medium text-foreground"
                    >
                      {category.name} ({category.count})
                    </Link>
                  ))}
                </div>
              </section>
            ) : null}
          </aside>

          <section className="text-start" aria-labelledby="language-articles-title">
            <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
              <div>
                <h2 id="language-articles-title" className="text-2xl font-semibold text-foreground">
                  Articles in {language.name}
                </h2>
                <p className="mt-2 text-sm leading-6 text-muted">
                  {totalArticles === 1 ? "1 article" : `${totalArticles} articles`} indexed in this language.
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
                  Article previews will appear here when blogs in this language are indexed.
                </p>
              </div>
            ) : (
              <div className="mt-5 grid gap-4">
                {articleItems.map((article) => (
                  <article key={article.id} className="rounded-lg border border-border bg-surface p-5">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-accent">
                      {article.categories[0]?.name ?? ""}
                    </p>
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
              <nav className="mt-8 flex items-center justify-between border-t border-border pt-6" aria-label="Language pagination">
                {currentPage > 1 ? (
                  <Link
                    href={languagePageHref(locale, languageCode, currentPage - 1)}
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
                    href={languagePageHref(locale, languageCode, currentPage + 1)}
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
