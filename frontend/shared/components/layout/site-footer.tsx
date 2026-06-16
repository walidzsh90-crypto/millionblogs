import Link from "next/link";

import type { Locale } from "@/i18n/config";
import { localizedPath } from "@/i18n/routing";

type SiteFooterProps = {
  locale: Locale;
};

function href(locale: Locale, path = "/") {
  return localizedPath(locale, path);
}

export function SiteFooter({ locale }: SiteFooterProps) {
  return (
    <footer className="bg-background px-6 py-10 text-sm text-muted lg:px-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <p>MillionBlogs / Multilingual blog discovery</p>
        <div className="flex flex-col gap-2 sm:items-end">
          <nav aria-label="Footer navigation" className="flex flex-wrap gap-4">
            <Link href={href(locale, "/blogs")}>Blogs</Link>
            <Link href={href(locale, "/articles")}>Articles</Link>
            <Link href={href(locale, "/categories")}>Categories</Link>
            <Link href={href(locale, "/languages")}>Languages</Link>
            <Link href={href(locale, "/support")}>Support</Link>
          </nav>
          <nav aria-label="Legal" className="flex flex-wrap gap-4 text-xs">
            <Link href={href(locale, "/privacy")}>Privacy Policy</Link>
            <Link href={href(locale, "/terms")}>Terms of Service</Link>
            <Link href={href(locale, "/cookies")}>Cookie Policy</Link>
          </nav>
        </div>
      </div>
    </footer>
  );
}
