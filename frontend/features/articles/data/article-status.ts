import type { ArticleStatus } from "../api/articles-api";

export type ArticleStatusConfig = {
  label: string;
  variant: "muted" | "warning" | "success" | "danger" | "promotion";
};

export const ARTICLE_STATUSES: Record<ArticleStatus, ArticleStatusConfig> = {
  draft: { label: "Draft", variant: "muted" },
  processing: { label: "Processing", variant: "warning" },
  published: { label: "Published", variant: "success" },
  rejected: { label: "Rejected", variant: "danger" },
  archived: { label: "Archived", variant: "muted" },
};

export const ARTICLE_LANGUAGES = [
  { code: "en", name: "English" },
  { code: "es", name: "Spanish" },
  { code: "fr", name: "French" },
  { code: "de", name: "German" },
  { code: "pt", name: "Portuguese" },
  { code: "it", name: "Italian" },
  { code: "nl", name: "Dutch" },
  { code: "ru", name: "Russian" },
  { code: "ja", name: "Japanese" },
  { code: "ko", name: "Korean" },
  { code: "zh", name: "Chinese" },
  { code: "ar", name: "Arabic" },
  { code: "hi", name: "Hindi" },
  { code: "tr", name: "Turkish" },
  { code: "pl", name: "Polish" },
  { code: "sv", name: "Swedish" },
  { code: "da", name: "Danish" },
  { code: "fi", name: "Finnish" },
  { code: "nb", name: "Norwegian" },
  { code: "cs", name: "Czech" },
  { code: "hu", name: "Hungarian" },
  { code: "ro", name: "Romanian" },
  { code: "uk", name: "Ukrainian" },
  { code: "el", name: "Greek" },
  { code: "he", name: "Hebrew" },
  { code: "th", name: "Thai" },
  { code: "vi", name: "Vietnamese" },
] as const;

export function getLanguageName(code: string): string {
  return ARTICLE_LANGUAGES.find((l) => l.code === code)?.name ?? code.toUpperCase();
}
