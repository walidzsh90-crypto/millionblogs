import type { Metadata } from "next";
import Link from "next/link";

import { AuthCard } from "@/features/auth/components/auth-card";
import { LoginForm } from "@/features/auth/components/login-form";
import { isSupportedLocale, type Locale } from "@/i18n/config";
import { localizedPath } from "@/i18n/routing";
import { createMetadata } from "@/seo/metadata";

type LoginPageProps = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export const metadata: Metadata = createMetadata({
  title: "Sign in",
  description: "Sign in to MillionBlogs.",
  noIndex: true
});

function firstValue(value: string | string[] | undefined): string {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

export default async function LoginPage({ params, searchParams }: LoginPageProps) {
  const { locale: localeParam } = await params;
  const rawSearchParams = await searchParams;
  const locale: Locale = isSupportedLocale(localeParam) ? localeParam : "en";

  return (
    <AuthCard
      locale={locale}
      title="Sign in"
      description="Access your MillionBlogs dashboard, profile, and publishing setup."
      footer={
        <div className="flex flex-col gap-2">
          <Link href={localizedPath(locale, "/auth/forgot-password")} className="font-semibold text-primary">
            Forgot password?
          </Link>
          <span>
            New to MillionBlogs?{" "}
            <Link href={localizedPath(locale, "/auth/register")} className="font-semibold text-primary">
              Create an account
            </Link>
          </span>
        </div>
      }
    >
      <LoginForm locale={locale} returnTo={firstValue(rawSearchParams.returnTo)} />
    </AuthCard>
  );
}
