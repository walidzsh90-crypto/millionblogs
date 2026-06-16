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
  type Subscription,
} from "@/features/subscriptions/api/subscriptions-api";
import { SubscriptionStatusBadge } from "@/features/subscriptions/components/subscription-status-badge";

export default function SubscriptionDetailsPage() {
  const params = useParams();
  const localeParam = String(params.locale ?? "en");
  const subscriptionId = String(params.subscriptionId ?? "");
  const locale: Locale = isSupportedLocale(localeParam) ? localeParam : "en";

  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!subscriptionId) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await subscriptionsApi.getById(subscriptionId);
      setSubscription(data);
    } catch (err: any) {
      setError(err?.message ?? "Failed to load subscription");
    } finally {
      setIsLoading(false);
    }
  }, [subscriptionId]);

  useEffect(() => { load(); }, [load]);

  if (error) {
    return (
      <main className="px-4 py-8">
        <ErrorState title="Failed to load subscription" message={error} reset={load} />
      </main>
    );
  }

  if (isLoading || !subscription) {
    return (
      <main className="px-4 py-8">
        <div className="mx-auto w-full max-w-4xl" aria-busy="true">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="mt-4 h-10 w-3/4" />
          <div className="mt-6 grid gap-4">
            <Skeleton className="h-48 w-full" />
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="px-4 py-8">
      <section className="mx-auto w-full max-w-4xl" aria-labelledby="subscription-detail-title">
        <nav className="mb-6 text-sm text-muted" aria-label="Breadcrumb">
          <Link
            href={localizedPath(locale, "/dashboard/subscriptions")}
            className="font-medium text-primary"
          >
            Subscriptions
          </Link>
          <span aria-hidden="true"> / {subscription.planName}</span>
        </nav>

        <div className="flex flex-wrap items-start justify-between gap-6">
          <div>
            <h1 id="subscription-detail-title" className="text-3xl font-semibold text-foreground">
              {subscription.planName}
            </h1>
            <div className="mt-2 flex items-center gap-2">
              <SubscriptionStatusBadge status={subscription.status} />
            </div>
          </div>
        </div>

        <div className="mt-8 rounded-lg border border-border bg-surface p-6">
          <h2 className="text-lg font-semibold text-foreground">Subscription details</h2>
          <dl className="mt-4 grid gap-4 text-sm md:grid-cols-2">
            <div>
              <dt className="text-muted">Status</dt>
              <dd className="mt-1"><SubscriptionStatusBadge status={subscription.status} /></dd>
            </div>
            <div>
              <dt className="text-muted">Plan</dt>
              <dd className="mt-1 font-medium text-foreground">{subscription.planName}</dd>
            </div>
            {subscription.currentPeriodStart && (
              <div>
                <dt className="text-muted">Period start</dt>
                <dd className="mt-1 font-medium text-foreground">
                  {new Date(subscription.currentPeriodStart).toLocaleDateString()}
                </dd>
              </div>
            )}
            {subscription.currentPeriodEnd && (
              <div>
                <dt className="text-muted">Period end</dt>
                <dd className="mt-1 font-medium text-foreground">
                  {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
                </dd>
              </div>
            )}
            {subscription.renewalDate && (
              <div>
                <dt className="text-muted">Renewal date</dt>
                <dd className="mt-1 font-medium text-foreground">
                  {new Date(subscription.renewalDate).toLocaleDateString()}
                </dd>
              </div>
            )}
            {subscription.expirationDate && (
              <div>
                <dt className="text-muted">Expiration date</dt>
                <dd className="mt-1 font-medium text-foreground">
                  {new Date(subscription.expirationDate).toLocaleDateString()}
                </dd>
              </div>
            )}
            {subscription.gracePeriodEnd && (
              <div>
                <dt className="text-muted">Grace period ends</dt>
                <dd className="mt-1 font-medium text-warning">
                  {new Date(subscription.gracePeriodEnd).toLocaleDateString()}
                </dd>
              </div>
            )}
            {subscription.nextBillingDate && (
              <div>
                <dt className="text-muted">Next billing date</dt>
                <dd className="mt-1 font-medium text-foreground">
                  {new Date(subscription.nextBillingDate).toLocaleDateString()}
                </dd>
              </div>
            )}
            {subscription.cancelledAt && (
              <div>
                <dt className="text-muted">Cancelled at</dt>
                <dd className="mt-1 font-medium text-foreground">
                  {new Date(subscription.cancelledAt).toLocaleDateString()}
                </dd>
              </div>
            )}
            <div>
              <dt className="text-muted">Created</dt>
              <dd className="mt-1 font-medium text-foreground">
                {new Date(subscription.createdAt).toLocaleDateString()}
              </dd>
            </div>
            <div>
              <dt className="text-muted">Updated</dt>
              <dd className="mt-1 font-medium text-foreground">
                {new Date(subscription.updatedAt).toLocaleDateString()}
              </dd>
            </div>
          </dl>
        </div>
      </section>
    </main>
  );
}
