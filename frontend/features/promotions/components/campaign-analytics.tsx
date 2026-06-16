import type { Campaign } from "../api/promotions-api";

type CampaignAnalyticsProps = {
  campaign: Campaign;
};

export function CampaignAnalytics({ campaign }: CampaignAnalyticsProps) {
  const ctrPct = campaign.impressions > 0
    ? ((campaign.clicks / campaign.impressions) * 100).toFixed(2)
    : "0.00";

  return (
    <div className="grid gap-4 sm:grid-cols-3">
      <div className="rounded-lg border border-border bg-surface p-5">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted">Impressions</p>
        <p className="mt-1 text-3xl font-bold text-foreground">
          {campaign.impressions.toLocaleString()}
        </p>
      </div>
      <div className="rounded-lg border border-border bg-surface p-5">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted">Clicks</p>
        <p className="mt-1 text-3xl font-bold text-foreground">
          {campaign.clicks.toLocaleString()}
        </p>
      </div>
      <div className="rounded-lg border border-border bg-surface p-5">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted">CTR</p>
        <p className="mt-1 text-3xl font-bold text-accent">{ctrPct}%</p>
      </div>
    </div>
  );
}
