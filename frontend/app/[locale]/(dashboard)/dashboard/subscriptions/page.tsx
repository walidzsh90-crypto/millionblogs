"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

import { localizedPath } from "@/i18n/routing";
import { isSupportedLocale, type Locale } from "@/i18n/config";
import { ErrorState } from "@/shared/components/feedback/error-state";
import { Skeleton } from "@/shared/ui/skeleton/skeleton";

import {
  subscriptionsApi,
  type Plan,
  type Subscription,
  type Payment,
} from "@/features/subscriptions/api/subscriptions-api";
import { PlanCard } from "@/features/subscriptions/components/plan-card";
import { PlanComparisonTable } from "@/features/subscriptions/components/plan-comparison-table";
import { CurrentSubscriptionCard } from "@/features/subscriptions/components/current-subscription-card";
import { CancelDialog } from "@/features/subscriptions/components/cancel-dialog";
import { InvoiceList } from "@/features/subscriptions/components/invoice-list";

export default function SubscriptionsPage() {
  const params = useParams();
  const localeParam = String(params.locale ?? "en");
  const locale: Locale = isSupportedLocale(localeParam) ? localeParam : "en";

  const [plans, setPlans] = useState<Plan[]>([]);
  const [activeSub, setActiveSub] = useState<Subscription | null>(null);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isSubscribing, setIsSubscribing] = useState(false);
  const [subscribeError, setSubscribeError] = useState<string | null>(null);

  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [plansData, activeData, subsData, paymentsData] = await Promise.all([
        subscriptionsApi.plans(),
        subscriptionsApi.active().catch(() => null),
        subscriptionsApi.list().catch(() => [] as Subscription[]),
        subscriptionsApi.payments(1, 10).catch(() => ({ items: [] as Payment[] })),
      ]);
      setPlans(plansData);
      setActiveSub(activeData);
      setSubscriptions(subsData);
      setPayments(paymentsData.items);
    } catch (err: any) {
      setError(err?.message ?? "Failed to load subscriptions");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleSubscribe(planId: string) {
    setIsSubscribing(true);
    setSubscribeError(null);
    try {
      await subscriptionsApi.create(planId);
      await load();
    } catch (err: any) {
      setSubscribeError(err?.message ?? "Failed to subscribe");
    } finally {
      setIsSubscribing(false);
    }
  }

  async function handleCancel() {
    if (!activeSub) return;
    setIsCancelling(true);
    setCancelError(null);
    try {
      await subscriptionsApi.cancel(activeSub.id);
      setShowCancelDialog(false);
      await load();
    } catch (err: any) {
      setCancelError(err?.message ?? "Failed to cancel subscription");
    } finally {
      setIsCancelling(false);
    }
  }

  if (error) {
    return (
      <main className="px-4 py-8">
        <ErrorState title="Failed to load subscriptions" message={error} reset={load} />
      </main>
    );
  }

  return (
    <main className="px-4 py-8">
      {showCancelDialog && activeSub && (
        <CancelDialog
          planName={activeSub.planName}
          onConfirm={handleCancel}
          onCancel={() => { setShowCancelDialog(false); setCancelError(null); }}
          isSubmitting={isCancelling}
          error={cancelError}
        />
      )}

      <section className="mx-auto w-full max-w-6xl" aria-labelledby="subscriptions-title">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.14em] text-accent">Subscriptions</p>
          <h1 id="subscriptions-title" className="mt-1 text-3xl font-semibold text-foreground">
            Subscriptions
          </h1>
          <p className="mt-1 text-sm text-muted">
            Choose a plan to unlock premium features for your blogs.
          </p>
        </div>

        {isLoading ? (
          <div className="mt-8 grid gap-6 md:grid-cols-3" aria-busy="true">
            <Skeleton className="h-80 w-full" />
            <Skeleton className="h-80 w-full" />
            <Skeleton className="h-80 w-full" />
          </div>
        ) : (
          <>
            {subscribeError && (
              <div className="mt-6 rounded-md border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">
                {subscribeError}
              </div>
            )}

            {activeSub && (
              <div className="mt-8">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-foreground">Current subscription</h2>
                  {activeSub.status !== "cancelled" && activeSub.status !== "expired" && (
                    <button
                      type="button"
                      onClick={() => setShowCancelDialog(true)}
                      className="rounded-md border border-danger/30 px-4 py-2 text-sm font-semibold text-danger"
                    >
                      Cancel
                    </button>
                  )}
                </div>
                <div className="mt-3">
                  <CurrentSubscriptionCard subscription={activeSub} />
                </div>
              </div>
            )}

            {plans.length > 0 && (
              <div className="mt-8">
                <h2 className="text-lg font-semibold text-foreground">Available plans</h2>
                <div className="mt-4 grid gap-6 md:grid-cols-3">
                  {plans
                    .sort((a, b) => a.sortOrder - b.sortOrder)
                    .map((plan) => (
                      <PlanCard
                        key={plan.id}
                        plan={plan}
                        isCurrentPlan={activeSub?.planId === plan.id}
                        isSubscribing={isSubscribing}
                        onSubscribe={handleSubscribe}
                      />
                    ))}
                </div>
              </div>
            )}

            {plans.length > 1 && (
              <div className="mt-8">
                <h2 className="text-lg font-semibold text-foreground">Plan comparison</h2>
                <div className="mt-4 rounded-lg border border-border bg-surface p-4">
                  <PlanComparisonTable plans={plans} />
                </div>
              </div>
            )}

            {subscriptions.length > 1 && (
              <div className="mt-8">
                <h2 className="text-lg font-semibold text-foreground">Subscription history</h2>
                <div className="mt-4 grid gap-3">
                  {subscriptions.map((sub) => (
                    <Link
                      key={sub.id}
                      href={localizedPath(locale, `/dashboard/subscriptions/${sub.id}`)}
                      className="rounded-lg border border-border bg-surface p-4 transition-colors hover:border-primary/50"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-semibold text-foreground">{sub.planName}</p>
                          <p className="text-xs text-muted">
                            {new Date(sub.createdAt).toLocaleDateString()}
                            {sub.currentPeriodEnd && ` — ${new Date(sub.currentPeriodEnd).toLocaleDateString()}`}
                          </p>
                        </div>
                        <span
                          className={`inline-block rounded-sm border px-2 py-0.5 text-xs font-semibold ${
                            sub.status === "active"
                              ? "border-success/20 bg-success/10 text-success"
                              : sub.status === "grace_period"
                                ? "border-warning/20 bg-warning/10 text-warning"
                                : sub.status === "expired" || sub.status === "cancelled"
                                  ? "border-muted/30 bg-muted/20 text-muted"
                                  : "border-muted/30 bg-muted/20 text-muted"
                          }`}
                        >
                          {sub.status}
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-8">
              <h2 className="text-lg font-semibold text-foreground">Payment history</h2>
              <div className="mt-4">
                <InvoiceList payments={payments} isLoading={false} />
              </div>
            </div>

            {!activeSub && plans.length === 0 && (
              <div className="mt-12 text-center">
                <h2 className="text-xl font-semibold text-foreground">No plans available</h2>
                <p className="mt-2 text-sm text-muted">
                  There are no subscription plans available at this time.
                </p>
              </div>
            )}
          </>
        )}
      </section>
    </main>
  );
}
