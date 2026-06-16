import type { ReactNode } from "react";
import Link from "next/link";

import type { Locale } from "@/i18n/config";
import { localizedPath } from "@/i18n/routing";

type AuthCardProps = {
  locale: Locale;
  title: string;
  description: string;
  children: ReactNode;
  footer?: ReactNode;
};

export function AuthCard({ locale, title, description, children, footer }: AuthCardProps) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-6 py-12 text-foreground lg:px-8">
      <section className="w-full max-w-md rounded-lg border border-border bg-surface p-6 shadow-raised" aria-labelledby="auth-title">
        <Link href={localizedPath(locale)} className="text-sm font-semibold text-primary">
          MillionBlogs
        </Link>
        <h1 id="auth-title" className="mt-6 text-3xl font-semibold text-foreground">
          {title}
        </h1>
        <p className="mt-3 text-sm leading-6 text-muted">{description}</p>
        <div className="mt-6">{children}</div>
        {footer ? <div className="mt-6 border-t border-border pt-5 text-sm text-muted">{footer}</div> : null}
      </section>
    </main>
  );
}
