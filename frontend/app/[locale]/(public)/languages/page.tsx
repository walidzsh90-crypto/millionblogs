import type { Metadata } from "next";
import Link from "next/link";

import { getDirection, isSupportedLocale, type Locale } from "@/i18n/config";
import { localizedPath, resolveLocale } from "@/i18n/routing";
import { createCanonicalPath } from "@/seo/canonical";
import { createHreflangAlternates } from "@/seo/hreflang";
import { createMetadata } from "@/seo/metadata";
import { JsonLd } from "@/shared/seo/json-ld";
import { fetchBlogs, fetchArticles } from "@/shared/api/data";

export const revalidate = 900;

type LanguagesPageProps = {
  params: Promise<{ locale: string }>;
};

function href(locale: Locale, path = "/") {
  return localizedPath(locale, path);
}

export async function generateMetadata({ params }: LanguagesPageProps): Promise<Metadata> {
  const { locale: localeParam } = await params;
  const locale = resolveLocale(localeParam);

  return createMetadata({
    title: "Languages",
    description: "Browse the MillionBlogs directory by language. Discover blogs and articles in English, Arabic with RTL support, and Dutch.",
    canonicalPath: createCanonicalPath(locale, "/languages"),
    languages: createHreflangAlternates("/languages"),
  });
}

export default async function LanguagesPage({ params }: LanguagesPageProps) {
  const { locale: localeParam } = await params;
  const locale = isSupportedLocale(localeParam) ? localeParam : "en";
  const currentDir = getDirection(locale);

  const [blogResult, articleResult] = await Promise.all([
    fetchBlogs({ pageSize: 100 }),
    fetchArticles({ pageSize: 100 }),
  ]);

  const blogLanguages = new Set(blogResult?.items.map((b) => b.primaryLanguage).filter(Boolean) ?? []);
  const articleLanguages = new Set(articleResult?.items?.map((a) => a.language).filter(Boolean) ?? []);

  const allLanguages = Array.from(new Set([...blogLanguages, ...articleLanguages])).sort();

  const languageData = allLanguages.map((code) => ({
    code,
    name: code.charAt(0).toUpperCase() + code.slice(1),
    direction: getDirection(code as Locale) || "ltr",
  }));

  const collectionJsonLd = languageData.length > 0 ? {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Languages — MillionBlogs",
    description: "Browse by language.",
    url: href(locale, "/languages"),
    mainEntity: {
      "@type": "ItemList",
      itemListElement: languageData.map((lang, i) => ({
        "@type": "ListItem",
        position: i + 1,
        item: { "@type": "Language", name: lang.name, url: href(locale, `/languages/${lang.code}`) },
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
              <span className="text-foreground">Languages</span>
            </nav>
            <h1 className="text-3xl font-semibold text-foreground">Languages</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">Browse the directory by language. Each language page shows articles, blogs, and popular categories.</p>
          </div>
        </section>

        <section className="px-6 py-10 lg:px-8" aria-labelledby="languages-list-title">
          <div className="mx-auto w-full max-w-7xl">
            <h2 id="languages-list-title" className="sr-only">All languages</h2>
            {languageData.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-16 text-center">
                <p className="text-lg font-semibold text-foreground">No languages yet</p>
                <p className="mt-2 text-sm text-muted">Languages will appear here once blogs and articles are available in the directory.</p>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {languageData.map((lang) => {
                  const langDir = getDirection(lang.code as Locale);
                  const blogCount = blogResult?.items?.filter((b) => b.primaryLanguage === lang.code).length ?? 0;
                  const articleCount = articleResult?.items?.filter((a) => a.language === lang.code).length ?? 0;
                  return (
                    <Link key={lang.code} href={href(locale, `/languages/${lang.code}`)} className="group rounded-lg border border-border bg-surface p-5 transition-colors hover:border-primary/50" dir={currentDir}>
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold text-foreground group-hover:text-primary">{lang.name}</h3>
                      </div>
                      <p className="mt-2 text-sm leading-6 text-muted">Browse content in {lang.name}.</p>
                      <div className="mt-4 flex gap-3 text-xs text-muted">
                        <span>{articleCount} articles</span>
                        <span>{blogCount} blogs</span>
                      </div>
                      {langDir === "rtl" && (
                        <span className="mt-3 inline-block rounded-sm border border-accent/20 bg-accent/10 px-2 py-0.5 text-[10px] font-semibold uppercase text-accent">RTL ready</span>
                      )}
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        <section className="border-t border-border bg-surface/50 px-6 py-10 lg:px-8">
          <div className="mx-auto w-full max-w-7xl text-center">
            <h2 className="text-xl font-semibold text-foreground">RTL and LTR support</h2>
            <p className="mt-2 text-sm text-muted">MillionBlogs supports both left-to-right and right-to-left scripts. Arabic content is displayed with proper RTL layout.</p>
          </div>
        </section>
      </main>
    </>
  );
}
