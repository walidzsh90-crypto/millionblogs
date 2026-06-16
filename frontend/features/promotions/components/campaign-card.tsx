import Link from "next/link";
import { useParams } from "next/navigation";

import { localizedPath } from "@/i18n/routing";
import { isSupportedLocale, type Locale } from "@/i18n/config";

import type { Campaign } from "../api/promotions-api";
import { CampaignStatusBadge } from "./campaign-status-badge";

type CampaignCardProps = {
  campaign: Campaign;
  onPause: (id: string) => void;
  onResume: (id: string) => void;
  isPending: boolean;
};

export function CampaignCard({ campaign, onPause, onResume, isPending }: CampaignCardProps) {
  const params = useParams();
  const localeParam = String(params.locale ?? "en");
  const locale: Locale = isSupportedLocale(localeParam) ? localeParam : "en";

  return (
    <Link
      href={localizedPath(locale, `/dashboard/promotions/${campaign.id}`)}
      className="block rounded-lg border border-border bg-surface p-4 transition-colors hover:border-primary/50"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="truncate text-sm font-semibold text-foreground">
              {campaign.packageName}
            </h3>
            <CampaignStatusBadge status={campaign.status} />
          </div>
          <p className="mt-0.5 text-xs text-muted">
            {campaign.type} &middot; {campaign.impressions} impressions &middot;{" "}
            {((campaign.ctr * 100) || 0).toFixed(2)}% CTR
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-2" onClick={(e) => e.preventDefault()}>
          {campaign.status === "active" && (
            <button
              type="button"
              disabled={isPending}
              onClick={() => onPause(campaign.id)}
              className="rounded-md border border-warning/30 px-3 py-1 text-xs font-semibold text-warning disabled:opacity-50"
            >
              {isPending ? "..." : "Pause"}
            </button>
          )}
          {campaign.status === "paused" && (
            <button
              type="button"
              disabled={isPending}
              onClick={() => onResume(campaign.id)}
              className="rounded-md border border-success/30 px-3 py-1 text-xs font-semibold text-success disabled:opacity-50"
            >
              {isPending ? "..." : "Resume"}
            </button>
          )}
        </div>
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2 border-t border-border pt-3 text-center text-xs">
        <div>
          <p className="font-semibold text-foreground">{campaign.creditsSpent}</p>
          <p className="text-muted">Spent</p>
        </div>
        <div>
          <p className="font-semibold text-foreground">{campaign.remainingCredits}</p>
          <p className="text-muted">Remaining</p>
        </div>
        <div>
          <p className="font-semibold text-foreground">{campaign.impressions}</p>
          <p className="text-muted">Impressions</p>
        </div>
      </div>
    </Link>
  );
}
