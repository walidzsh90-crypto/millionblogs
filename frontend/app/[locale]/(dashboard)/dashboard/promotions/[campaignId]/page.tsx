"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

import { localizedPath } from "@/i18n/routing";
import { isSupportedLocale, type Locale } from "@/i18n/config";
import { ErrorState } from "@/shared/components/feedback/error-state";
import { Skeleton } from "@/shared/ui/skeleton/skeleton";

import { promotionsApi, type Campaign } from "@/features/promotions/api/promotions-api";
import { CampaignStatusBadge } from "@/features/promotions/components/campaign-status-badge";
import { CampaignAnalytics } from "@/features/promotions/components/campaign-analytics";

export default function CampaignDetailsPage() {
  const params = useParams();
  const localeParam = String(params.locale ?? "en");
  const campaignId = String(params.campaignId ?? "");
  const locale: Locale = isSupportedLocale(localeParam) ? localeParam : "en";

  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionPending, setActionPending] = useState(false);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await promotionsApi.getCampaign(campaignId);
      setCampaign(data);
    } catch (err: any) {
      setError(err?.message ?? "Failed to load campaign");
    } finally {
      setIsLoading(false);
    }
  }, [campaignId]);

  useEffect(() => { load(); }, [load]);

  async function handlePause() {
    if (!campaign) return;
    setActionPending(true);
    try {
      const updated = await promotionsApi.pause(campaign.id);
      setCampaign(updated);
    } catch {
      await load();
    } finally {
      setActionPending(false);
    }
  }

  async function handleResume() {
    if (!campaign) return;
    setActionPending(true);
    try {
      const updated = await promotionsApi.activate(campaign.id);
      setCampaign(updated);
    } catch {
      await load();
    } finally {
      setActionPending(false);
    }
  }

  async function handleCancel() {
    if (!campaign) return;
    setActionPending(true);
    try {
      const updated = await promotionsApi.cancel(campaign.id);
      setCampaign(updated);
    } catch {
      await load();
    } finally {
      setActionPending(false);
    }
  }

  if (error) {
    return (
      <main className="px-4 py-8">
        <ErrorState title="Campaign not found" message={error} reset={load} />
      </main>
    );
  }

  return (
    <main className="px-4 py-8">
      <section className="mx-auto w-full max-w-4xl" aria-labelledby="campaign-detail-title">
        <nav className="mb-6 text-sm text-muted" aria-label="Breadcrumb">
          <Link
            href={localizedPath(locale, "/dashboard/promotions")}
            className="hover:text-foreground"
          >
            Promotions
          </Link>
          <span className="mx-2">/</span>
          <span className="text-foreground">
            {isLoading ? "..." : campaign?.packageName ?? "Campaign"}
          </span>
        </nav>

        {isLoading ? (
          <div aria-busy="true" className="space-y-6">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        ) : campaign ? (
          <>
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.14em] text-accent">
                  Campaign
                </p>
                <h1
                  id="campaign-detail-title"
                  className="mt-1 text-3xl font-semibold text-foreground"
                >
                  {campaign.packageName}
                </h1>
                <div className="mt-2 flex items-center gap-2">
                  <CampaignStatusBadge status={campaign.status} />
                  <span className="text-xs text-muted">{campaign.type}</span>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {campaign.status === "active" && (
                  <button
                    type="button"
                    disabled={actionPending}
                    onClick={handlePause}
                    className="rounded-md border border-warning/30 px-4 py-2 text-sm font-semibold text-warning disabled:opacity-50"
                  >
                    {actionPending ? "..." : "Pause"}
                  </button>
                )}
                {campaign.status === "paused" && (
                  <button
                    type="button"
                    disabled={actionPending}
                    onClick={handleResume}
                    className="rounded-md border border-success/30 px-4 py-2 text-sm font-semibold text-success disabled:opacity-50"
                  >
                    {actionPending ? "..." : "Resume"}
                  </button>
                )}
                {(campaign.status === "draft" || campaign.status === "active" || campaign.status === "paused") && (
                  <button
                    type="button"
                    disabled={actionPending}
                    onClick={handleCancel}
                    className="rounded-md border border-danger/30 px-4 py-2 text-sm font-semibold text-danger disabled:opacity-50"
                  >
                    {actionPending ? "..." : "Cancel"}
                  </button>
                )}
              </div>
            </div>

            <div className="mt-6">
              <h2 className="text-lg font-semibold text-foreground">Analytics</h2>
              <div className="mt-3">
                <CampaignAnalytics campaign={campaign} />
              </div>
            </div>

            <div className="mt-8 grid gap-6 sm:grid-cols-2">
              <div className="rounded-lg border border-border bg-surface p-5">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-muted">
                  Budget
                </h3>
                <div className="mt-3 space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted">Budget</span>
                    <span className="font-semibold text-foreground">
                      {campaign.creditsBudget} credits
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted">Spent</span>
                    <span className="font-semibold text-foreground">
                      {campaign.creditsSpent} credits
                    </span>
                  </div>
                  <div className="flex items-center justify-between border-t border-border pt-2">
                    <span className="font-semibold text-foreground">Remaining</span>
                    <span className="font-bold text-success">
                      {campaign.remainingCredits} credits
                    </span>
                  </div>
                </div>
              </div>

              <div className="rounded-lg border border-border bg-surface p-5">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-muted">
                  Details
                </h3>
                <div className="mt-3 space-y-2 text-sm">
                  <DetailRow label="Package" value={campaign.packageName} />
                  <DetailRow label="Type" value={campaign.type} />
                  <DetailRow label="Target" value={campaign.targetId ?? "None"} />
                  <DetailRow label="Weight" value={String(campaign.weight)} />
                  <DetailRow
                    label="Start"
                    value={campaign.startDate ? new Date(campaign.startDate).toLocaleDateString() : "—"}
                  />
                  <DetailRow
                    label="End"
                    value={campaign.endDate ? new Date(campaign.endDate).toLocaleDateString() : "—"}
                  />
                  <DetailRow
                    label="Created"
                    value={new Date(campaign.createdAt).toLocaleDateString()}
                  />
                </div>
              </div>
            </div>
          </>
        ) : null}
      </section>
    </main>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted">{label}</span>
      <span className="text-foreground">{value}</span>
    </div>
  );
}
