export const env = {
  appUrl: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  apiBaseUrl: process.env.NEXT_PUBLIC_API_BASE_URL ?? "/api/v1",
  analyticsEnabled: process.env.NEXT_PUBLIC_ANALYTICS_ENABLED === "true"
} as const;
