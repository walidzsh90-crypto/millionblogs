import type { SubscriptionStatus } from "../api/subscriptions-api";

export type SubscriptionStatusConfig = {
  label: string;
  variant: "muted" | "warning" | "success" | "danger" | "promotion";
};

export const SUBSCRIPTION_STATUSES: Record<SubscriptionStatus, SubscriptionStatusConfig> = {
  pending: { label: "Pending", variant: "warning" },
  active: { label: "Active", variant: "success" },
  grace_period: { label: "Grace Period", variant: "warning" },
  expired: { label: "Expired", variant: "danger" },
  cancelled: { label: "Cancelled", variant: "muted" },
  suspended: { label: "Suspended", variant: "danger" },
};

export function formatPrice(cents: number, currency: string): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(cents / 100);
}
