import type { Metadata } from "next";
import Link from "next/link";

import { isSupportedLocale, type Locale } from "@/i18n/config";
import { localizedPath, resolveLocale } from "@/i18n/routing";
import { createCanonicalPath } from "@/seo/canonical";
import { createHreflangAlternates } from "@/seo/hreflang";
import { createMetadata } from "@/seo/metadata";
import { JsonLd } from "@/shared/seo/json-ld";
import { cookiesContent } from "@/shared/content/legal-content";

export const revalidate = 900;

type PageProps = {
  params: Promise<{ locale: string }>;
};

function href(locale: Locale, path = "/") {
  return localizedPath(locale, path);
}

function getContent(locale: string) {
  return cookiesContent[locale] ?? cookiesContent.en;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale: localeParam } = await params;
  const locale = resolveLocale(localeParam);

  return createMetadata({
    title: getContent(locale).title,
    description: getContent(locale).description,
    canonicalPath: createCanonicalPath(locale, "/cookies"),
    languages: createHreflangAlternates("/cookies"),
  });
}

export default async function CookiesPage({ params }: PageProps) {
  const { locale: localeParam } = await params;
  const locale = isSupportedLocale(localeParam) ? localeParam : "en";
  const content = getContent(locale);

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: `https://millionblogs.com/${locale}` },
      { "@type": "ListItem", position: 2, name: content.title },
    ],
  };

  return (
    <>
      <JsonLd data={breadcrumbJsonLd} />
      <main className="bg-background text-foreground">
        <section className="border-b border-border bg-surface/50 px-6 py-10 lg:px-8">
          <div className="mx-auto w-full max-w-7xl">
            <nav className="mb-4 text-sm text-muted" aria-label="Breadcrumb">
              <Link href={href(locale)} className="hover:text-foreground">Home</Link>
              <span className="mx-2">/</span>
              <span className="text-foreground">{content.title}</span>
            </nav>
            <h1 className="text-3xl font-semibold text-foreground">{content.title}</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">{content.description}</p>
            <p className="mt-2 text-xs text-muted">Last updated: {content.lastUpdated}</p>
          </div>
        </section>

        <section className="px-6 py-10 lg:px-8">
          <div className="mx-auto w-full max-w-3xl">
            <div className="divide-y divide-border">
              {content.sections.map((section) => (
                <article key={section.heading} className="py-6 first:pt-0">
                  <h2 className="text-lg font-semibold text-foreground">{section.heading}</h2>
                  <p className="mt-3 text-sm leading-6 text-muted">{section.body}</p>
                </article>
              ))}
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
