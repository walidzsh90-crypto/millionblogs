import type { Metadata } from "next";
import Link from "next/link";

import { AuthCard } from "@/features/auth/components/auth-card";
import { ResetPasswordForm } from "@/features/auth/components/password-forms";
import { isSupportedLocale, type Locale } from "@/i18n/config";
import { localizedPath } from "@/i18n/routing";
import { createMetadata } from "@/seo/metadata";

type ResetPasswordPageProps = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export const metadata: Metadata = createMetadata({
  title: "Reset password",
  description: "Set a new MillionBlogs password.",
  noIndex: true
});

function firstValue(value: string | string[] | undefined): string {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

export default async function ResetPasswordPage({ params, searchParams }: ResetPasswordPageProps) {
  const { locale: localeParam } = await params;
  const rawSearchParams = await searchParams;
  const locale: Locale = isSupportedLocale(localeParam) ? localeParam : "en";

  return (
    <AuthCard
      locale={locale}
      title="Set a new password"
      description="Choose a new password for your MillionBlogs account."
      footer={
        <Link href={localizedPath(locale, "/auth/login")} className="font-semibold text-primary">
          Back to sign in
        </Link>
      }
    >
      <ResetPasswordForm token={firstValue(rawSearchParams.token)} />
    </AuthCard>
  );
}
