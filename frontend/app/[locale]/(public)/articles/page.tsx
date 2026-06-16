import type { Metadata } from "next";
import Link from "next/link";

import { isSupportedLocale, type Locale } from "@/i18n/config";
import { localizedPath, resolveLocale } from "@/i18n/routing";
import { createCanonicalPath } from "@/seo/canonical";
import { createHreflangAlternates } from "@/seo/hreflang";
import { createMetadata } from "@/seo/metadata";
import { JsonLd } from "@/shared/seo/json-ld";
import { fetchArticles } from "@/shared/api/data";
import type { ArticleDto, CategoryRef } from "@/shared/api/types";

export const revalidate = 900;

type ArticlesPageProps = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function href(locale: Locale, path = "/") {
  return localizedPath(locale, path);
}

export async function generateMetadata({ params }: ArticlesPageProps): Promise<Metadata> {
  const { locale: localeParam } = await params;
  const locale = resolveLocale(localeParam);

  return createMetadata({
    title: "Articles",
    description: "Browse fresh articles from independent blogs. Filter by category, language, and publisher in the MillionBlogs directory.",
    canonicalPath: createCanonicalPath(locale, "/articles"),
    languages: createHreflangAlternates("/articles"),
  });
}

export default async function ArticlesPage({ params, searchParams }: ArticlesPageProps) {
  const { locale: localeParam } = await params;
  const resolved = await searchParams;
  const locale = isSupportedLocale(localeParam) ? localeParam : "en";

  const q = typeof resolved.q === "string" ? resolved.q : "";
  const lang = typeof resolved.lang === "string" ? resolved.lang : "";
  const cat = typeof resolved.cat === "string" ? resolved.cat : "";
  const blog = typeof resolved.blog === "string" ? resolved.blog : "";
  const pageRaw = typeof resolved.page === "string" ? Number(resolved.page) : 1;

  const result = await fetchArticles({
    search: q || undefined,
    language: lang || undefined,
    categorySlug: cat || undefined,
    blogId: blog || undefined,
    page: pageRaw,
    pageSize: 6,
  });

  const articles: ArticleDto[] = result?.items ?? [];
  const total = result?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / 6));

  const allLanguages = Array.from(new Set(articles.map((a) => a.language).filter(Boolean))).sort();
  const allCategories: CategoryRef[] = [];
  const seenCat = new Set<string>();
  for (const a of articles) {
    for (const c of a.categories) {
      if (!seenCat.has(c.slug)) { seenCat.add(c.slug); allCategories.push(c); }
    }
  }
  const allBlogEntries: { id: string; name: string }[] = [];
  const seenBlog = new Set<string>();
  for (const a of articles) {
    if (a.blog && !seenBlog.has(a.blog.id)) { seenBlog.add(a.blog.id); allBlogEntries.push(a.blog); }
  }

  const queryString = (overrides: Record<string, string | number>) => {
    const p: Record<string, string> = {};
    if (q) p.q = q;
    if (lang) p.lang = lang;
    if (cat) p.cat = cat;
    if (blog) p.blog = blog;
    if (overrides.page) p.page = String(overrides.page);
    return new URLSearchParams(p).toString();
  };

  const collectionJsonLd = articles.length > 0 ? {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Articles — MillionBlogs",
    description: "Fresh articles from independent blogs.",
    url: href(locale, "/articles"),
    mainEntity: {
      "@type": "ItemList",
      itemListElement: articles.map((a, i) => ({
        "@type": "ListItem",
        position: i + 1,
        item: { "@type": "Article", headline: a.title, description: a.excerpt, url: href(locale, `/articles/${a.id}`) },
      })),
    },
  } : null;

  return (
    <>
      {collectionJsonLd && <JsonLd data={collectionJsonLd} />}
      <main className="bg-background text-foreground">
        <section className="border-b border-border bg-surface/50 px-6 py-10 lg:px-8">
          <div className="mx-auto w-full max-w-7xl">
            <nav className="mb-4 text-sm text-muted" aria-label="Breadcrumb">
              <Link href={href(locale)} className="hover:text-foreground">Home</Link>
              <span className="mx-2">/</span>
              <span className="text-foreground">Articles</span>
            </nav>
            <h1 className="text-3xl font-semibold text-foreground">Articles</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">Fresh articles from independent publishers across the MillionBlogs directory.</p>
          </div>
        </section>

        <section className="border-b border-border px-6 py-6 lg:px-8">
          <div className="mx-auto w-full max-w-7xl">
            <form method="GET" action={href(locale, "/articles")} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              <div className="lg:col-span-2">
                <label htmlFor="articles-search" className="sr-only">Search articles</label>
                <input id="articles-search" type="search" name="q" defaultValue={q} placeholder="Search by title or excerpt..." className="min-h-11 w-full rounded-md border border-border bg-background px-4 text-sm text-foreground placeholder:text-muted" />
              </div>
              <div>
                <label htmlFor="articles-cat" className="sr-only">Category</label>
                <select id="articles-cat" name="cat" defaultValue={cat} className="min-h-11 w-full rounded-md border border-border bg-background px-3 text-sm text-foreground">
                  <option value="">All categories</option>
                  {allCategories.map((c) => (<option key={c.slug} value={c.slug}>{c.name}</option>))}
                </select>
              </div>
              <div>
                <label htmlFor="articles-lang" className="sr-only">Language</label>
                <select id="articles-lang" name="lang" defaultValue={lang} className="min-h-11 w-full rounded-md border border-border bg-background px-3 text-sm text-foreground">
                  <option value="">All languages</option>
                  {allLanguages.map((l) => (<option key={l} value={l}>{l}</option>))}
                </select>
              </div>
              <div>
                <label htmlFor="articles-blog" className="sr-only">Blog</label>
                <select id="articles-blog" name="blog" defaultValue={blog} className="min-h-11 w-full rounded-md border border-border bg-background px-3 text-sm text-foreground">
                  <option value="">All blogs</option>
                  {allBlogEntries.map((b) => (<option key={b.id} value={b.id}>{b.name}</option>))}
                </select>
              </div>
              <div className="flex gap-2 sm:col-span-2 lg:col-span-5">
                <button type="submit" className="min-h-11 rounded-md bg-primary px-5 text-sm font-semibold text-white">Filter</button>
                {(q || lang || cat || blog) && (
                  <Link href={href(locale, "/articles")} className="min-h-11 rounded-md border border-border px-4 py-2.5 text-sm font-semibold text-foreground">Reset</Link>
                )}
              </div>
            </form>
          </div>
        </section>

        <section className="px-6 py-10 lg:px-8" aria-labelledby="articles-list-title">
          <div className="mx-auto w-full max-w-7xl">
            <h2 id="articles-list-title" className="sr-only">Article list</h2>
            {articles.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-16 text-center">
                <p className="text-lg font-semibold text-foreground">No articles found</p>
                <p className="mt-2 text-sm text-muted">No articles match your criteria. Try different filters or check back later.</p>
                <Link href={href(locale, "/articles")} className="mt-4 rounded-md bg-primary px-5 py-2.5 text-sm font-semibold text-white">View all articles</Link>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {articles.map((article) => (
                  <Link key={article.id} href={href(locale, `/articles/${article.id}`)} className="group rounded-lg border border-border bg-surface p-5 transition-colors hover:border-primary/50">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-accent">{article.categories[0]?.name ?? "General"}</p>
                    <h3 className="mt-2 text-base font-semibold leading-6 text-foreground group-hover:text-primary">{article.title}</h3>
                    <p className="mt-2 line-clamp-2 text-sm leading-6 text-muted">{article.excerpt ?? "No excerpt available."}</p>
                    <div className="mt-4 flex items-center justify-between text-xs text-muted">
                      <span>{article.blog?.name ?? "Unknown"}</span>
                      {article.publishedAt && <span>{new Date(article.publishedAt).toLocaleDateString()}</span>}
                    </div>
                  </Link>
                ))}
              </div>
            )}

            {totalPages > 1 && (
              <nav className="mt-8 flex items-center justify-between" aria-label="Article pagination">
                <p className="text-xs text-muted">Page {result?.page ?? 1} of {totalPages}</p>
                <div className="flex gap-2">
                  {(result?.page ?? 1) > 1 ? (
                    <Link href={`${href(locale, "/articles")}?${queryString({ page: (result?.page ?? 1) - 1 })}`} className="rounded-md border border-border px-3 py-1.5 text-sm font-semibold text-foreground">Previous</Link>
                  ) : (
                    <span className="rounded-md border border-border px-3 py-1.5 text-sm font-semibold text-muted opacity-40">Previous</span>
                  )}
                  {(result?.page ?? 1) < totalPages ? (
                    <Link href={`${href(locale, "/articles")}?${queryString({ page: (result?.page ?? 1) + 1 })}`} className="rounded-md border border-border px-3 py-1.5 text-sm font-semibold text-foreground">Next</Link>
                  ) : (
                    <span className="rounded-md border border-border px-3 py-1.5 text-sm font-semibold text-muted opacity-40">Next</span>
                  )}
                </div>
              </nav>
            )}
          </div>
        </section>
      </main>
    </>
  );
}
