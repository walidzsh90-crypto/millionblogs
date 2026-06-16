import type { Metadata } from "next";
import Link from "next/link";

import { isSupportedLocale, type Locale } from "@/i18n/config";
import { localizedPath, resolveLocale } from "@/i18n/routing";
import { createCanonicalPath } from "@/seo/canonical";
import { createHreflangAlternates } from "@/seo/hreflang";
import { createMetadata } from "@/seo/metadata";
import { JsonLd } from "@/shared/seo/json-ld";

export const revalidate = 900;

type SupportPageProps = {
  params: Promise<{ locale: string }>;
};

type FaqItem = {
  question: string;
  answer: string;
};

const faqItems: FaqItem[] = [
  {
    question: "How do I add my blog to the directory?",
    answer: "Create an account, navigate to the dashboard, and use the \"My Blogs\" section to register your blog. You will need to verify ownership via meta tag, DNS TXT record, or HTML file upload.",
  },
  {
    question: "How does RSS feed integration work?",
    answer: "After registering your blog, add your RSS feed URL in the \"RSS Feeds\" section of your dashboard. The platform will automatically sync your articles into the directory.",
  },
  {
    question: "What are wallet credits used for?",
    answer: "Wallet credits power promotion campaigns. Use them to boost your articles and blog visibility across the directory. Credits can be purchased from the subscriptions page.",
  },
  {
    question: "Can I cancel my subscription at any time?",
    answer: "Yes. You can cancel your subscription from the dashboard at any time. Access to premium features continues until the end of the current billing period.",
  },
  {
    question: "How does blog ownership verification work?",
    answer: "We offer three verification methods: adding a meta tag to your blog's homepage, creating a DNS TXT record for your domain, or uploading an HTML file. All methods are explained step by step in the dashboard.",
  },
  {
    question: "What languages does MillionBlogs support?",
    answer: "MillionBlogs currently supports English, Arabic (with full RTL layout), and Dutch. More languages will be added based on community demand.",
  },
  {
    question: "How do I contact support?",
    answer: "Registered bloggers can submit a support ticket from the dashboard. For general inquiries, email us at support@millionblogs.com.",
  },
];

function href(locale: Locale, path = "/") {
  return localizedPath(locale, path);
}

export async function generateMetadata({ params }: SupportPageProps): Promise<Metadata> {
  const { locale: localeParam } = await params;
  const locale = resolveLocale(localeParam);

  return createMetadata({
    title: "Support",
    description: "Get help with MillionBlogs. Browse frequently asked questions or contact the support team.",
    canonicalPath: createCanonicalPath(locale, "/support"),
    languages: createHreflangAlternates("/support"),
  });
}

export default async function SupportPage({ params }: SupportPageProps) {
  const { locale: localeParam } = await params;
  const locale = isSupportedLocale(localeParam) ? localeParam : "en";

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqItems.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: { "@type": "Answer", text: item.answer },
    })),
  };

  return (
    <>
      <JsonLd data={faqJsonLd} />
      <main className="bg-background text-foreground">
        <section className="border-b border-border bg-surface/50 px-6 py-10 lg:px-8">
          <div className="mx-auto w-full max-w-7xl">
            <nav className="mb-4 text-sm text-muted" aria-label="Breadcrumb">
              <Link href={href(locale)} className="hover:text-foreground">Home</Link>
              <span className="mx-2">/</span>
              <span className="text-foreground">Support</span>
            </nav>
            <h1 className="text-3xl font-semibold text-foreground">Support</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
              Find answers to common questions or reach out to the team for help.
            </p>
          </div>
        </section>

        <section className="px-6 py-10 lg:px-8" aria-labelledby="faq-title">
          <div className="mx-auto w-full max-w-3xl">
            <h2 id="faq-title" className="text-2xl font-semibold text-foreground">Frequently asked questions</h2>

            <div className="mt-8 divide-y divide-border">
              {faqItems.map((item) => (
                <details key={item.question} className="group py-4">
                  <summary className="flex cursor-pointer items-center justify-between text-sm font-semibold text-foreground">
                    {item.question}
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true" className="shrink-0 text-muted transition-transform group-open:rotate-180">
                      <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </summary>
                  <p className="mt-3 text-sm leading-6 text-muted">{item.answer}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        <section className="border-y border-border bg-surface/50 px-6 py-14 lg:px-8" aria-labelledby="contact-title">
          <div className="mx-auto w-full max-w-3xl text-center">
            <h2 id="contact-title" className="text-2xl font-semibold text-foreground">Still need help?</h2>
            <p className="mt-2 text-sm text-muted">
              Registered bloggers can submit a support ticket from the dashboard.
            </p>
            <div className="mt-6 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link
                href={href(locale, "/auth/register")}
                className="min-h-11 rounded-md bg-primary px-6 py-2.5 text-sm font-semibold text-white"
              >
                Create an account
              </Link>
              <Link
                href={href(locale, "/auth/login")}
                className="min-h-11 rounded-md border border-border px-6 py-2.5 text-sm font-semibold text-foreground"
              >
                Sign in
              </Link>
            </div>
            <p className="mt-6 text-sm text-muted">
              Or email us at <a href="mailto:support@millionblogs.com" className="text-primary hover:underline">support@millionblogs.com</a>
            </p>
          </div>
        </section>
      </main>
    </>
  );
}
