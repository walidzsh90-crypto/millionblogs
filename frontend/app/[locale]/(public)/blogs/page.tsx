import type { Metadata } from "next";
import Link from "next/link";

import { isSupportedLocale, type Locale } from "@/i18n/config";
import { localizedPath, resolveLocale } from "@/i18n/routing";
import { createCanonicalPath } from "@/seo/canonical";
import { createHreflangAlternates } from "@/seo/hreflang";
import { createMetadata } from "@/seo/metadata";
import { JsonLd } from "@/shared/seo/json-ld";
import { fetchBlogs, extractCategories } from "@/shared/api/data";
import type { BlogDto, CategoryRef } from "@/shared/api/types";

export const revalidate = 900;

type BlogsPageProps = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function href(locale: Locale, path = "/") {
  return localizedPath(locale, path);
}

function badgeColor(status: string) {
  if (status === "verified") return "border-success/20 bg-success/10 text-success";
  if (status === "featured") return "border-accent/20 bg-accent/10 text-accent";
  if (status === "trusted") return "border-primary/20 bg-primary/10 text-primary";
  if (status === "new") return "border-warning/20 bg-warning/10 text-warning";
  return "border-muted/30 bg-muted/20 text-muted";
}

function formatStatus(status: string): string {
  switch (status) {
    case "verified": return "Verified";
    case "trusted": return "Trusted";
    case "featured": return "Featured";
    case "new": return "New";
    default: return status;
  }
}

export async function generateMetadata({ params }: BlogsPageProps): Promise<Metadata> {
  const { locale: localeParam } = await params;
  const locale = resolveLocale(localeParam);

  return createMetadata({
    title: "Blogs",
    description: "Browse independent blogs by category, language, and topic. Discover verified publishers and fresh content from the MillionBlogs directory.",
    canonicalPath: createCanonicalPath(locale, "/blogs"),
    languages: createHreflangAlternates("/blogs"),
  });
}

export default async function BlogsPage({ params, searchParams }: BlogsPageProps) {
  const { locale: localeParam } = await params;
  const resolved = await searchParams;
  const locale = isSupportedLocale(localeParam) ? localeParam : "en";

  const q = typeof resolved.q === "string" ? resolved.q : "";
  const lang = typeof resolved.lang === "string" ? resolved.lang : "";
  const cat = typeof resolved.cat === "string" ? resolved.cat : "";

  const result = await fetchBlogs({ search: q || undefined, language: lang || undefined, categorySlug: cat || undefined, pageSize: 50 });

  const blogs: BlogDto[] = result?.items ?? [];
  const categories: CategoryRef[] = blogs.length > 0 ? await extractCategories(blogs) : [];

  const collectionJsonLd = blogs.length > 0 ? {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Blogs — MillionBlogs",
    description: "Independent blogs in the MillionBlogs directory.",
    url: href(locale, "/blogs"),
    mainEntity: {
      "@type": "ItemList",
      itemListElement: blogs.map((b, i) => ({
        "@type": "ListItem",
        position: i + 1,
        item: { "@type": "Blog", name: b.name, description: b.description, url: href(locale, `/blogs/${b.slug}`) },
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
              <span className="text-foreground">Blogs</span>
            </nav>
            <h1 className="text-3xl font-semibold text-foreground">Blogs</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
              Discover independent publishers, verified blogs, and fresh voices from the MillionBlogs directory.
            </p>
          </div>
        </section>

        <section className="border-b border-border px-6 py-6 lg:px-8">
          <div className="mx-auto w-full max-w-7xl">
            <form method="GET" action={href(locale, "/blogs")} className="flex flex-col gap-3 sm:flex-row sm:items-end">
              <div className="flex-1">
                <label htmlFor="blogs-search" className="sr-only">Search blogs</label>
                <input id="blogs-search" type="search" name="q" defaultValue={q} placeholder="Search by name or description..." className="min-h-11 w-full rounded-md border border-border bg-background px-4 text-sm text-foreground placeholder:text-muted" />
              </div>
              <div className="sm:w-44">
                <label htmlFor="blogs-lang" className="sr-only">Language</label>
                <select id="blogs-lang" name="lang" defaultValue={lang} className="min-h-11 w-full rounded-md border border-border bg-background px-3 text-sm text-foreground">
                  <option value="">All languages</option>
                  {Array.from(new Set(blogs.map((b) => b.primaryLanguage).filter(Boolean))).map((l) => (
                    <option key={l} value={l}>{l}</option>
                  ))}
                </select>
              </div>
              <div className="sm:w-44">
                <label htmlFor="blogs-cat" className="sr-only">Category</label>
                <select id="blogs-cat" name="cat" defaultValue={cat} className="min-h-11 w-full rounded-md border border-border bg-background px-3 text-sm text-foreground">
                  <option value="">All categories</option>
                  {categories.map((c) => (
                    <option key={c.slug} value={c.slug}>{c.name}</option>
                  ))}
                </select>
              </div>
              <button type="submit" className="min-h-11 rounded-md bg-primary px-5 text-sm font-semibold text-white">Filter</button>
              {(q || lang || cat) && (
                <Link href={href(locale, "/blogs")} className="min-h-11 rounded-md border border-border px-4 py-2.5 text-sm font-semibold text-foreground">Reset</Link>
              )}
            </form>
          </div>
        </section>

        <section className="px-6 py-10 lg:px-8" aria-labelledby="blogs-list-title">
          <div className="mx-auto w-full max-w-7xl">
            <h2 id="blogs-list-title" className="sr-only">Blog list</h2>
            {blogs.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-16 text-center">
                <p className="text-lg font-semibold text-foreground">No blogs found</p>
                <p className="mt-2 text-sm text-muted">No blogs match your criteria. Try different filters or check back later.</p>
                <Link href={href(locale, "/blogs")} className="mt-4 rounded-md bg-primary px-5 py-2.5 text-sm font-semibold text-white">View all blogs</Link>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {blogs.map((blog) => (
                  <Link key={blog.id} href={href(locale, `/blogs/${blog.slug}`)} className="group rounded-lg border border-border bg-surface p-5 transition-colors hover:border-primary/50">
                    <div className="flex items-center gap-3">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-primary/10 text-sm font-bold text-primary">
                        {blog.name.charAt(0).toUpperCase()}
                      </span>
                      <div className="min-w-0 flex-1">
                        <h3 className="truncate text-sm font-semibold text-foreground group-hover:text-primary">{blog.name}</h3>
                        <p className="text-xs text-muted">{blog.primaryLanguage ?? "Unknown"}</p>
                      </div>
                    </div>
                    <p className="mt-3 line-clamp-2 text-sm leading-6 text-muted">{blog.description ?? "No description."}</p>
                    <div className="mt-4 flex flex-wrap gap-1.5">
                      {blog.trustStatus && blog.trustStatus !== "new" && (
                        <span className={`rounded-sm border px-1.5 py-0.5 text-[10px] font-semibold uppercase ${badgeColor(blog.trustStatus)}`}>
                          {formatStatus(blog.trustStatus)}
                        </span>
                      )}
                      {blog.categories.slice(0, 3).map((cat) => (
                        <span key={cat.slug} className="rounded-sm border border-border/50 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-muted">{cat.name}</span>
                      ))}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </section>

        <section className="border-t border-border bg-primary px-6 py-10 text-white lg:px-8">
          <div className="mx-auto w-full max-w-7xl text-center">
            <h2 className="text-2xl font-semibold">Register your blog</h2>
            <p className="mt-2 text-sm text-white/85">Add your blog to the directory and reach readers browsing by topic and language.</p>
            <Link href={href(locale, "/auth/register")} className="mt-5 inline-block rounded-md bg-white px-6 py-3 text-sm font-semibold text-primary">Get started</Link>
          </div>
        </section>
      </main>
    </>
  );
}
