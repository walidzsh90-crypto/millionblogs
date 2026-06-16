import type { DashboardWidget } from "@/features/dashboard/data/dashboard-widgets";

export function DashboardEmptyWidget({ widget }: { widget: DashboardWidget }) {
  return (
    <article className="rounded-lg border border-border bg-surface p-5 text-start">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-foreground">{widget.title}</h2>
          <p className="mt-2 text-sm leading-6 text-muted">{widget.description}</p>
        </div>
        <span className="rounded-sm bg-info/10 px-2 py-1 text-xs font-semibold text-info">{widget.status}</span>
      </div>
      <p className="mt-5 text-sm font-semibold text-muted">{widget.actionLabel}</p>
    </article>
  );
}
