"use client";

import { useCallback, useEffect, useState } from "react";

import { ErrorState } from "@/shared/components/feedback/error-state";
import { Skeleton } from "@/shared/ui/skeleton/skeleton";

import {
  promotionsApi,
  type PromotionPackage,
  type Campaign,
  type CampaignStatus,
  type CreateCampaignInput,
} from "@/features/promotions/api/promotions-api";
import { PackageCard } from "@/features/promotions/components/package-card";
import { CampaignCard } from "@/features/promotions/components/campaign-card";
import { CampaignFilters } from "@/features/promotions/components/campaign-filters";
import { CreateCampaignDialog } from "@/features/promotions/components/create-campaign-dialog";
import { walletApi } from "@/features/wallet/api/wallet-api";

export default function PromotionsPage() {
  const [packages, setPackages] = useState<PromotionPackage[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [statusFilter, setStatusFilter] = useState<CampaignStatus | "">("");
  const [walletBalance, setWalletBalance] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedPkg, setSelectedPkg] = useState<PromotionPackage | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const [actionPendingId, setActionPendingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [pkgData, campaignsData, balanceData] = await Promise.all([
        promotionsApi.packages(),
        promotionsApi.campaigns(
          (statusFilter ? { status: statusFilter as CampaignStatus, page, pageSize } : { page, pageSize }) as any
        ),
        walletApi.getBalance().catch(() => ({ totalBalance: 0 })),
      ]);
      setPackages(pkgData);
      setCampaigns(campaignsData.items);
      setTotal(campaignsData.total);
      setWalletBalance(balanceData.totalBalance);
    } catch (err: any) {
      setError(err?.message ?? "Failed to load promotions");
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter, page, pageSize]);

  useEffect(() => { load(); }, [load]);

  function handleStatusFilterChange(value: CampaignStatus | "") {
    setStatusFilter(value);
    setPage(1);
  }

  async function handleCreate(input: CreateCampaignInput) {
    setIsCreating(true);
    setCreateError(null);
    try {
      await promotionsApi.create(input);
      setSelectedPkg(null);
      await load();
    } catch (err: any) {
      setCreateError(err?.message ?? "Failed to create campaign");
    } finally {
      setIsCreating(false);
    }
  }

  async function handlePause(id: string) {
    setActionPendingId(id);
    try {
      await promotionsApi.pause(id);
      await load();
    } finally {
      setActionPendingId(null);
    }
  }

  async function handleResume(id: string) {
    setActionPendingId(id);
    try {
      await promotionsApi.activate(id);
      await load();
    } finally {
      setActionPendingId(null);
    }
  }

  if (error) {
    return (
      <main className="px-4 py-8">
        <ErrorState title="Failed to load promotions" message={error} reset={load} />
      </main>
    );
  }

  return (
    <main className="px-4 py-8">
      {selectedPkg && (
        <CreateCampaignDialog
          pkg={selectedPkg}
          walletBalance={walletBalance}
          onSubmit={handleCreate}
          onClose={() => { setSelectedPkg(null); setCreateError(null); }}
          isSubmitting={isCreating}
          error={createError}
        />
      )}

      <section className="mx-auto w-full max-w-6xl" aria-labelledby="promotions-title">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.14em] text-accent">Promotions</p>
          <h1 id="promotions-title" className="mt-1 text-3xl font-semibold text-foreground">
            Promotions
          </h1>
          <p className="mt-1 text-sm text-muted">
            Boost your content with promotion campaigns using wallet credits.
          </p>
        </div>

        {isLoading ? (
          <>
            <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3" aria-busy="true">
              <Skeleton className="h-44 w-full" />
              <Skeleton className="h-44 w-full" />
              <Skeleton className="h-44 w-full" />
            </div>
            <div className="mt-8 space-y-3">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
            </div>
          </>
        ) : (
          <>
            {packages.length > 0 && (
              <div className="mt-6">
                <h2 className="text-lg font-semibold text-foreground">Promotion packages</h2>
                <div className="mt-4 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {packages.map((pkg) => (
                    <PackageCard key={pkg.id} pkg={pkg} onSelect={setSelectedPkg} />
                  ))}
                </div>
              </div>
            )}

            <div className="mt-8">
              <h2 className="text-lg font-semibold text-foreground">Your campaigns</h2>
              <div className="mt-3">
                <CampaignFilters active={statusFilter} onChange={handleStatusFilterChange} />
              </div>

              {campaigns.length > 0 ? (
                <div className="mt-4 grid gap-4">
                  {campaigns.map((c) => (
                    <CampaignCard
                      key={c.id}
                      campaign={c}
                      onPause={handlePause}
                      onResume={handleResume}
                      isPending={actionPendingId === c.id}
                    />
                  ))}
                </div>
              ) : (
                <div className="mt-6 flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-12 text-center">
                  <svg width="40" height="40" viewBox="0 0 40 40" fill="none" aria-hidden="true" className="mb-4 text-muted">
                    <rect x="4" y="10" width="32" height="22" rx="2" stroke="currentColor" strokeWidth="2" />
                    <path d="M4 16h32" stroke="currentColor" strokeWidth="2" />
                    <rect x="10" y="20" width="8" height="4" rx="1" fill="currentColor" opacity="0.3" />
                    <rect x="22" y="20" width="8" height="4" rx="1" fill="currentColor" opacity="0.3" />
                  </svg>
                  <p className="text-sm font-semibold text-foreground">No campaigns yet</p>
                  <p className="mt-1 text-xs text-muted">
                    Choose a package above to create your first promotion campaign.
                  </p>
                </div>
              )}

              {total > pageSize && (
                <div className="mt-6 flex items-center justify-between">
                  <p className="text-xs text-muted">
                    Page {page} of {Math.ceil(total / pageSize)} ({total} total)
                  </p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      disabled={page <= 1}
                      onClick={() => setPage(page - 1)}
                      className="rounded-md border border-border px-3 py-1.5 text-sm font-semibold text-foreground disabled:opacity-40"
                    >
                      Previous
                    </button>
                    <button
                      type="button"
                      disabled={page >= Math.ceil(total / pageSize)}
                      onClick={() => setPage(page + 1)}
                      className="rounded-md border border-border px-3 py-1.5 text-sm font-semibold text-foreground disabled:opacity-40"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}

              {!statusFilter && campaigns.length === 0 && packages.length === 0 && (
                <div className="mt-12 text-center">
                  <h2 className="text-xl font-semibold text-foreground">No promotions available</h2>
                  <p className="mt-2 text-sm text-muted">
                    Promotion packages are not available at this time.
                  </p>
                </div>
              )}
            </div>
          </>
        )}
      </section>
    </main>
  );
}
