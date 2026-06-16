export interface FeedValidationResult {
  valid: boolean;
  feedType: 'rss' | 'atom' | null;
  title: string | null;
  description: string | null;
  siteUrl: string | null;
  language: string | null;
  icon: string | null;
  entries: number;
  errors: string[];
  warnings: string[];
}
