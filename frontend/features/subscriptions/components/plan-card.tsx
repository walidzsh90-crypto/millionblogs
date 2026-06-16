"use client";

import type { Plan } from "../api/subscriptions-api";
import { formatPrice } from "../data/subscription-status";

type PlanCardProps = {
  plan: Plan;
  isCurrentPlan: boolean;
  isSubscribing: boolean;
  onSubscribe: (planId: string) => void;
};

export function PlanCard({ plan, isCurrentPlan, isSubscribing, onSubscribe }: PlanCardProps) {
  const featureList = plan.features as Record<string, boolean | string> | null;

  return (
    <article
      className={`rounded-lg border-2 p-6 ${
        isCurrentPlan
          ? "border-promotion bg-promotion/5"
          : "border-border bg-surface"
      }`}
      aria-labelledby={`plan-${plan.slug}-title`}
    >
      <div className="text-center">
        {plan.isFree ? (
          <p className="text-4xl font-bold text-foreground">Free</p>
        ) : (
          <>
            <p className="text-4xl font-bold text-foreground">
              {formatPrice(plan.price, plan.currency)}
            </p>
            <p className="mt-1 text-sm text-muted">one-time</p>
          </>
        )}
      </div>

      <h2
        id={`plan-${plan.slug}-title`}
        className="mt-4 text-center text-xl font-semibold text-foreground"
      >
        {plan.name}
      </h2>
      {plan.description && (
        <p className="mt-2 text-center text-sm text-muted">{plan.description}</p>
      )}

      {featureList && Object.keys(featureList).length > 0 && (
        <ul className="mt-6 space-y-3">
          {Object.entries(featureList).map(([key, value]) => (
            <li key={key} className="flex items-center gap-3 text-sm">
              <span aria-hidden="true" className="text-success shrink-0">
                {typeof value === "boolean" && value ? "✓" : typeof value === "string" ? value : "✓"}
              </span>
              <span className="text-foreground">{key}</span>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-8 text-center">
        {isCurrentPlan ? (
          <span className="inline-block rounded-md bg-promotion/10 px-5 py-2.5 text-sm font-semibold text-promotion">
            Current plan
          </span>
        ) : plan.isFree ? (
          <span className="inline-block rounded-md border border-border px-5 py-2.5 text-sm text-muted">
            Free
          </span>
        ) : (
          <button
            type="button"
            onClick={() => onSubscribe(plan.id)}
            disabled={isSubscribing}
            className="rounded-md bg-primary px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
          >
            {isSubscribing ? "Processing..." : "Subscribe"}
          </button>
        )}
      </div>
    </article>
  );
}
