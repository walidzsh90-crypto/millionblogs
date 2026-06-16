import type { MetadataRoute } from "next";

import { supportedLocales, type Locale } from "@/i18n/config";

const publicPages = ["", "/blogs", "/articles", "/categories", "/languages", "/pricing", "/support", "/privacy", "/terms", "/cookies"];

export default function sitemap(): MetadataRoute.Sitemap {
  const entries: MetadataRoute.Sitemap = [];

  for (const locale of supportedLocales) {
    for (const page of publicPages) {
      entries.push({
        url: `/${locale}${page}`,
        lastModified: new Date(),
        changeFrequency: page === "" ? "daily" : "weekly",
        priority: page === "" ? 1 : 0.8,
      });
    }
  }

  return entries;
}
