export type DashboardWidget = {
  title: string;
  description: string;
  actionLabel: string;
  href?: string;
  status: "empty" | "pending" | "ready";
};

export const dashboardWidgets: DashboardWidget[] = [
  {
    title: "Register your first blog",
    description: "Blog registration will appear in a later dashboard phase.",
    actionLabel: "Not available yet",
    status: "empty"
  },
  {
    title: "Connect an RSS feed",
    description: "Feed setup is intentionally excluded from this foundation phase.",
    actionLabel: "Coming later",
    status: "empty"
  },
  {
    title: "Review notifications",
    description: "Notification delivery is represented as a placeholder only.",
    actionLabel: "Placeholder",
    status: "pending"
  }
];
