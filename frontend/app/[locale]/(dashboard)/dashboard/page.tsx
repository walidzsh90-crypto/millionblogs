import type { Metadata } from "next";

import { DashboardEmptyWidget } from "@/features/dashboard/components/dashboard-empty-widget";
import { dashboardWidgets } from "@/features/dashboard/data/dashboard-widgets";
import { createMetadata } from "@/seo/metadata";

export const metadata: Metadata = createMetadata({
  title: "Dashboard",
  description: "MillionBlogs dashboard foundation.",
  noIndex: true
});

export default function DashboardHomePage() {
  return (
    <main className="px-4 py-8">
      <section className="mx-auto w-full max-w-6xl text-start" aria-labelledby="dashboard-home-title">
        <div className="rounded-lg border border-border bg-surface p-6">
          <p className="text-sm font-semibold uppercase tracking-[0.14em] text-accent">Foundation</p>
          <h2 id="dashboard-home-title" className="mt-2 text-3xl font-semibold text-foreground">
            Your dashboard is ready for setup.
          </h2>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-muted">
            This phase establishes the protected dashboard shell, navigation, user menu, notification placeholder, and empty widgets. Product workflows arrive in later phases.
          </p>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {dashboardWidgets.map((widget) => (
            <DashboardEmptyWidget key={widget.title} widget={widget} />
          ))}
        </div>
      </section>
    </main>
  );
}
