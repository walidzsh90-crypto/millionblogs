import type { Metadata } from "next";
import Link from "next/link";

import { AuthCard } from "@/features/auth/components/auth-card";
import { RegisterForm } from "@/features/auth/components/register-form";
import { isSupportedLocale, type Locale } from "@/i18n/config";
import { localizedPath } from "@/i18n/routing";
import { createMetadata } from "@/seo/metadata";

type RegisterPageProps = {
  params: Promise<{ locale: string }>;
};

export const metadata: Metadata = createMetadata({
  title: "Create account",
  description: "Create a MillionBlogs account.",
  noIndex: true
});

export default async function RegisterPage({ params }: RegisterPageProps) {
  const { locale: localeParam } = await params;
  const locale: Locale = isSupportedLocale(localeParam) ? localeParam : "en";

  return (
    <AuthCard
      locale={locale}
      title="Create account"
      description="Start your blogger dashboard foundation and prepare to register your blog."
      footer={
        <span>
          Already have an account?{" "}
          <Link href={localizedPath(locale, "/auth/login")} className="font-semibold text-primary">
            Sign in
          </Link>
        </span>
      }
    >
      <RegisterForm locale={locale} />
    </AuthCard>
  );
}
