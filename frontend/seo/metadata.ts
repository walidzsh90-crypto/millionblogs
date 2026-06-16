import type { Metadata } from "next";

type SeoMetadataInput = {
  title: string;
  description: string;
  canonicalPath?: string;
  languages?: Record<string, string>;
  noIndex?: boolean;
  imageUrl?: string;
};

export function createMetadata(input: SeoMetadataInput): Metadata {
  return {
    title: input.title,
    description: input.description,
    alternates: input.canonicalPath
      ? {
          canonical: input.canonicalPath,
          languages: input.languages
        }
      : undefined,
    openGraph: {
      title: input.title,
      description: input.description,
      images: input.imageUrl ? [{ url: input.imageUrl }] : undefined
    },
    twitter: {
      card: input.imageUrl ? "summary_large_image" : "summary",
      title: input.title,
      description: input.description,
      images: input.imageUrl ? [input.imageUrl] : undefined
    },
    robots: input.noIndex
      ? {
          index: false,
          follow: false
        }
      : undefined
  };
}
