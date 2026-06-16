import type { Metadata } from "next";
import Link from "next/link";

import { isSupportedLocale, type Locale } from "@/i18n/config";
import { localizedPath, resolveLocale } from "@/i18n/routing";
import { createCanonicalPath } from "@/seo/canonical";
import { createHreflangAlternates } from "@/seo/hreflang";
import { createMetadata } from "@/seo/metadata";
import { JsonLd } from "@/shared/seo/json-ld";
import { fetchBlogs, extractCategories } from "@/shared/api/data";

export const revalidate = 900;

type CategoriesPageProps = {
  params: Promise<{ locale: string }>;
};

function href(locale: Locale, path = "/") {
  return localizedPath(locale, path);
}

export async function generateMetadata({ params }: CategoriesPageProps): Promise<Metadata> {
  const { locale: localeParam } = await params;
  const locale = resolveLocale(localeParam);

  return createMetadata({
    title: "Categories",
    description: "Browse blog categories in the MillionBlogs directory. Discover topics from Technology and Food to Culture and Design.",
    canonicalPath: createCanonicalPath(locale, "/categories"),
    languages: createHreflangAlternates("/categories"),
  });
}

export default async function CategoriesPage({ params }: CategoriesPageProps) {
  const { locale: localeParam } = await params;
  const locale = isSupportedLocale(localeParam) ? localeParam : "en";

  const result = await fetchBlogs({ pageSize: 100 });
  const categories = result?.items ? await extractCategories(result.items) : [];

  const collectionJsonLd = categories.length > 0 ? {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Categories — MillionBlogs",
    description: "Browse blog categories.",
    url: href(locale, "/categories"),
    mainEntity: {
      "@type": "ItemList",
      itemListElement: categories.map((c, i) => ({
        "@type": "ListItem",
        position: i + 1,
        item: { "@type": "Thing", name: c.name, url: href(locale, `/categories/${c.slug}`) },
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
              <span className="text-foreground">Categories</span>
            </nav>
            <h1 className="text-3xl font-semibold text-foreground">Categories</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">Browse the directory by topic. Each category page lists relevant articles and featured blogs.</p>
          </div>
        </section>

        <section className="px-6 py-10 lg:px-8" aria-labelledby="categories-list-title">
          <div className="mx-auto w-full max-w-7xl">
            <h2 id="categories-list-title" className="sr-only">All categories</h2>
            {categories.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-16 text-center">
                <p className="text-lg font-semibold text-foreground">No categories yet</p>
                <p className="mt-2 text-sm text-muted">Categories will appear here once blogs are registered and categorized.</p>
                <Link href={href(locale, "/auth/register")} className="mt-4 rounded-md bg-primary px-5 py-2.5 text-sm font-semibold text-white">Add your blog</Link>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {categories.map((cat) => (
                  <Link key={cat.slug} href={href(locale, `/categories/${cat.slug}`)} className="group rounded-lg border border-border bg-surface p-5 transition-colors hover:border-primary/50">
                    <h3 className="text-lg font-semibold text-foreground group-hover:text-primary">{cat.name}</h3>
                    <p className="mt-2 text-sm leading-6 text-muted">Browse articles and blogs in {cat.name}.</p>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </section>
      </main>
    </>
  );
}
