export type AnalyticsEvent =
  | "page_view"
  | "search_submitted"
  | "blog_click"
  | "article_click"
  | "pwa_install_prompt"
  | "api_error";

export type AnalyticsPayload = Record<string, string | number | boolean | null | undefined>;
