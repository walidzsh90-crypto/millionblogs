import type { Subscription } from "../api/subscriptions-api";
import { SubscriptionStatusBadge } from "./subscription-status-badge";

type CurrentSubscriptionCardProps = {
  subscription: Subscription;
};

export function CurrentSubscriptionCard({ subscription }: CurrentSubscriptionCardProps) {
  return (
    <div className="rounded-lg border-2 border-success/30 bg-success/5 p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-semibold text-foreground">{subscription.planName}</h2>
            <SubscriptionStatusBadge status={subscription.status} />
          </div>
          <p className="mt-1 text-sm text-muted">
            {subscription.status === "active" && subscription.currentPeriodEnd
              ? `Renewal: ${new Date(subscription.currentPeriodEnd).toLocaleDateString()}`
              : subscription.status === "grace_period" && subscription.gracePeriodEnd
                ? `Grace period ends: ${new Date(subscription.gracePeriodEnd).toLocaleDateString()}`
                : `Created: ${new Date(subscription.createdAt).toLocaleDateString()}`}
          </p>
        </div>
      </div>

      {subscription.status === "grace_period" && subscription.gracePeriodEnd && (
        <div className="mt-4 rounded-md bg-warning/10 px-4 py-3 text-sm text-warning">
          Your subscription is in the grace period. Please renew before{" "}
          <strong>{new Date(subscription.gracePeriodEnd).toLocaleDateString()}</strong> to avoid
          losing access.
        </div>
      )}

      <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
        {subscription.currentPeriodStart && (
          <div>
            <dt className="text-muted">Period start</dt>
            <dd className="font-medium text-foreground">
              {new Date(subscription.currentPeriodStart).toLocaleDateString()}
            </dd>
          </div>
        )}
        {subscription.currentPeriodEnd && (
          <div>
            <dt className="text-muted">Period end</dt>
            <dd className="font-medium text-foreground">
              {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
            </dd>
          </div>
        )}
        {subscription.renewalDate && (
          <div>
            <dt className="text-muted">Renewal date</dt>
            <dd className="font-medium text-foreground">
              {new Date(subscription.renewalDate).toLocaleDateString()}
            </dd>
          </div>
        )}
        {subscription.gracePeriodEnd && (
          <div>
            <dt className="text-muted">Grace period ends</dt>
            <dd className="font-medium text-foreground">
              {new Date(subscription.gracePeriodEnd).toLocaleDateString()}
            </dd>
          </div>
        )}
        {subscription.cancelledAt && (
          <div>
            <dt className="text-muted">Cancelled at</dt>
            <dd className="font-medium text-foreground">
              {new Date(subscription.cancelledAt).toLocaleDateString()}
            </dd>
          </div>
        )}
      </dl>
    </div>
  );
}
