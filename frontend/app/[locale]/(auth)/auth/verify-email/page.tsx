import type { Metadata } from "next";

import { AuthCard } from "@/features/auth/components/auth-card";
import { VerifyEmailPanel } from "@/features/auth/components/verify-email-panel";
import { isSupportedLocale, type Locale } from "@/i18n/config";
import { createMetadata } from "@/seo/metadata";

type VerifyEmailPageProps = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export const metadata: Metadata = createMetadata({
  title: "Verify email",
  description: "Verify your MillionBlogs email address.",
  noIndex: true
});

function firstValue(value: string | string[] | undefined): string {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

export default async function VerifyEmailPage({ params, searchParams }: VerifyEmailPageProps) {
  const { locale: localeParam } = await params;
  const rawSearchParams = await searchParams;
  const locale: Locale = isSupportedLocale(localeParam) ? localeParam : "en";

  return (
    <AuthCard locale={locale} title="Verify your email" description="Confirm your email address to keep your MillionBlogs account ready.">
      <VerifyEmailPanel locale={locale} token={firstValue(rawSearchParams.token)} />
    </AuthCard>
  );
}
