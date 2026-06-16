import type { Metadata } from "next";
import Link from "next/link";

import { AuthCard } from "@/features/auth/components/auth-card";
import { ForgotPasswordForm } from "@/features/auth/components/password-forms";
import { isSupportedLocale, type Locale } from "@/i18n/config";
import { localizedPath } from "@/i18n/routing";
import { createMetadata } from "@/seo/metadata";

type ForgotPasswordPageProps = {
  params: Promise<{ locale: string }>;
};

export const metadata: Metadata = createMetadata({
  title: "Forgot password",
  description: "Request a MillionBlogs password reset.",
  noIndex: true
});

export default async function ForgotPasswordPage({ params }: ForgotPasswordPageProps) {
  const { locale: localeParam } = await params;
  const locale: Locale = isSupportedLocale(localeParam) ? localeParam : "en";

  return (
    <AuthCard
      locale={locale}
      title="Reset your password"
      description="Enter your email and we will send password reset instructions if an account exists."
      footer={
        <Link href={localizedPath(locale, "/auth/login")} className="font-semibold text-primary">
          Back to sign in
        </Link>
      }
    >
      <ForgotPasswordForm />
    </AuthCard>
  );
}
