import type { Metadata } from "next";
import Link from "next/link";

import { isSupportedLocale, type Locale } from "@/i18n/config";
import { localizedPath, resolveLocale } from "@/i18n/routing";
import { createCanonicalPath } from "@/seo/canonical";
import { createHreflangAlternates } from "@/seo/hreflang";
import { createMetadata } from "@/seo/metadata";
import { JsonLd } from "@/shared/seo/json-ld";
import { fetchPlans } from "@/shared/api/data";
import type { PlanDto } from "@/shared/api/types";

export const revalidate = 900;

type PricingPageProps = {
  params: Promise<{ locale: string }>;
};

function href(locale: Locale, path = "/") {
  return localizedPath(locale, path);
}

function formatInterval(interval: string): string {
  switch (interval) {
    case "monthly": return "/month";
    case "yearly": return "/year";
    case "once": return "one-time";
    default: return `/${interval}`;
  }
}

function extractFeatures(plan: PlanDto): string[] {
  if (typeof plan.features === "object" && plan.features !== null) {
    return Object.entries(plan.features).map(([, v]) => String(v));
  }
  return [];
}

export async function generateMetadata({ params }: PricingPageProps): Promise<Metadata> {
  const { locale: localeParam } = await params;
  const locale = resolveLocale(localeParam);

  return createMetadata({
    title: "Pricing",
    description: "Choose the right plan for your blog. Free, Starter, and Professional plans available. Founder program and wallet credits included.",
    canonicalPath: createCanonicalPath(locale, "/pricing"),
    languages: createHreflangAlternates("/pricing"),
  });
}

export default async function PricingPage({ params }: PricingPageProps) {
  const { locale: localeParam } = await params;
  const locale = isSupportedLocale(localeParam) ? localeParam : "en";

  const plans = await fetchPlans();

  const pricingJsonLd = plans && plans.length > 0 ? {
    "@context": "https://schema.org",
    "@type": "Product",
    name: "MillionBlogs Plans",
    description: "Subscription plans for independent bloggers.",
    offers: plans.map((p) => ({
      "@type": "Offer",
      name: p.name,
      price: p.price,
      priceCurrency: p.currency || "USD",
      description: p.description,
    })),
  } : null;

  return (
    <>
      {pricingJsonLd && <JsonLd data={pricingJsonLd} />}
      <main className="bg-background text-foreground">
        <section className="border-b border-border bg-surface/50 px-6 py-10 lg:px-8">
          <div className="mx-auto w-full max-w-7xl">
            <nav className="mb-4 text-sm text-muted" aria-label="Breadcrumb">
              <Link href={href(locale)} className="hover:text-foreground">Home</Link>
              <span className="mx-2">/</span>
              <span className="text-foreground">Pricing</span>
            </nav>
            <h1 className="text-3xl font-semibold text-foreground">Pricing</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">Choose a plan that fits your publishing goals. Upgrade or cancel at any time.</p>
          </div>
        </section>

        {plans && plans.length > 0 ? (
          <section className="px-6 py-14 lg:px-8" aria-labelledby="plans-title">
            <div className="mx-auto w-full max-w-6xl">
              <h2 id="plans-title" className="text-2xl font-semibold text-foreground text-center">Subscription plans</h2>
              <p className="mt-2 text-center text-sm text-muted">All plans include directory listing and RSS feed integration.</p>

              <div className="mt-10 grid gap-6 md:grid-cols-3">
                {plans.sort((a, b) => a.sortOrder - b.sortOrder).map((plan, idx) => {
                  const isHighlighted = idx === Math.floor(plans.length / 2);
                  const features = extractFeatures(plan);
                  return (
                    <div key={plan.id} className={`rounded-lg border p-6 ${isHighlighted ? "border-primary bg-primary/5 shadow-raised" : "border-border bg-surface"}`}>
                      {isHighlighted && (
                        <span className="inline-block rounded-sm bg-primary/10 px-2 py-0.5 text-[10px] font-semibold uppercase text-primary">Popular</span>
                      )}
                      <h3 className="mt-2 text-xl font-semibold text-foreground">{plan.name}</h3>
                      <div className="mt-3">
                        <span className="text-3xl font-bold text-foreground">${plan.price}</span>
                        <span className="ml-1 text-sm text-muted">{formatInterval(plan.interval)}</span>
                      </div>
                      {plan.description && <p className="mt-3 text-sm leading-6 text-muted">{plan.description}</p>}
                      {features.length > 0 && (
                        <ul className="mt-5 space-y-2" role="list">
                          {features.map((f, i) => (
                            <li key={i} className="flex items-start gap-2 text-sm text-foreground">
                              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true" className="mt-0.5 shrink-0 text-success">
                                <path d="M3 8l3 3 7-7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                              </svg>
                              {f}
                            </li>
                          ))}
                        </ul>
                      )}
                      <Link href={href(locale, "/auth/register")} className={`mt-6 flex min-h-11 items-center justify-center rounded-md text-sm font-semibold ${isHighlighted ? "bg-primary text-white" : "border border-border text-foreground"}`}>
                        {plan.price === 0 ? "Get started" : "Subscribe"}
                      </Link>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>
        ) : (
          <section className="px-6 py-14 lg:px-8">
            <div className="mx-auto w-full max-w-md text-center">
              <div className="rounded-lg border border-dashed border-border py-12">
                <p className="text-lg font-semibold text-foreground">Plans loading</p>
                <p className="mt-2 text-sm text-muted">Subscription plans are not available at the moment. Please check back later.</p>
              </div>
            </div>
          </section>
        )}

        <section className="border-y border-border bg-surface/50 px-6 py-14 lg:px-8" aria-labelledby="founder-title">
          <div className="mx-auto w-full max-w-4xl">
            <h2 id="founder-title" className="text-2xl font-semibold text-foreground text-center">Founder program</h2>
            <p className="mt-2 text-center text-sm text-muted">Support the platform early and unlock lifetime benefits.</p>
            <div className="mt-8 grid gap-6 md:grid-cols-2">
              <div className="rounded-lg border border-accent/30 bg-accent/5 p-6 md:col-span-2 md:mx-auto md:w-2/3">
                <h3 className="text-xl font-semibold text-foreground">Founder Seat</h3>
                <p className="mt-1 text-sm text-accent font-semibold">One-time</p>
                <p className="mt-2 text-sm leading-6 text-muted">Early supporter status with lifetime benefits.</p>
                <ul className="mt-4 space-y-2" role="list">
                  {["Lifetime discount on all plans", "Founder badge on your profile", "Early access to new features", "Direct feedback channel", "Name in contributor list"].map((b) => (
                    <li key={b} className="flex items-start gap-2 text-sm text-foreground">
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true" className="mt-0.5 shrink-0 text-accent">
                        <path d="M3 8l3 3 7-7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      {b}
                    </li>
                  ))}
                </ul>
                <Link href={href(locale, "/auth/register")} className="mt-5 flex min-h-11 items-center justify-center rounded-md border border-accent/30 text-sm font-semibold text-accent">Join founder program</Link>
              </div>
            </div>
          </div>
        </section>

        <section className="px-6 py-14 lg:px-8" aria-labelledby="credits-title">
          <div className="mx-auto w-full max-w-4xl">
            <h2 id="credits-title" className="text-2xl font-semibold text-foreground text-center">Wallet credits</h2>
            <p className="mt-2 text-center text-sm text-muted">Use credits for promotion campaigns and featured placements.</p>
            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              {[{ name: "Starter Pack", credits: "100", price: "$10" }, { name: "Growth Pack", credits: "500", price: "$45" }, { name: "Pro Pack", credits: "2,000", price: "$160" }].map((pkg) => (
                <div key={pkg.name} className="rounded-lg border border-border bg-surface p-5 text-center">
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-muted">{pkg.name}</h3>
                  <p className="mt-2 text-2xl font-bold text-foreground">{pkg.credits}</p>
                  <p className="text-xs text-muted">credits</p>
                  <p className="mt-2 text-lg font-semibold text-primary">{pkg.price}</p>
                </div>
              ))}
            </div>
            <p className="mt-6 text-center text-xs text-muted">Credits are used for promotion campaigns. Sign up to purchase credits and boost your content.</p>
          </div>
        </section>

        <section className="border-t border-border bg-primary px-6 py-10 text-white lg:px-8">
          <div className="mx-auto w-full max-w-4xl text-center">
            <h2 className="text-2xl font-semibold">Ready to get started?</h2>
            <p className="mt-2 text-sm text-white/85">Create your account and add your blog to the directory in minutes.</p>
            <Link href={href(locale, "/auth/register")} className="mt-5 inline-block rounded-md bg-white px-6 py-3 text-sm font-semibold text-primary">Create your account</Link>
          </div>
        </section>
      </main>
    </>
  );
}
