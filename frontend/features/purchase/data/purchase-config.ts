export type CreditPackConfig = {
  planId: string;
  name: string;
  slug: string;
  credits: number;
  priceCents: number;
  currency: string;
  popular?: boolean;
  description: string;
};

export const CREDIT_PACKS: CreditPackConfig[] = [
  {
    planId: "PLAN_ID_STARTER",
    name: "Starter Pack",
    slug: "credits-100",
    credits: 100,
    priceCents: 1000,
    currency: "usd",
    description: "Perfect for getting started with promotions.",
  },
  {
    planId: "PLAN_ID_GROWTH",
    name: "Growth Pack",
    slug: "credits-500",
    credits: 500,
    priceCents: 4500,
    currency: "usd",
    popular: true,
    description: "Best value for active promoters. Save 10% per credit.",
  },
  {
    planId: "PLAN_ID_PRO",
    name: "Pro Pack",
    slug: "credits-2000",
    credits: 2000,
    priceCents: 16000,
    currency: "usd",
    description: "For power users running multiple campaigns. Save 20% per credit.",
  },
];

export function formatPrice(cents: number, currency: string): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(cents / 100);
}

export function statusVariant(status: string): "success" | "danger" | "warning" | "muted" {
  switch (status) {
    case "completed":
      return "success";
    case "failed":
      return "danger";
    case "cancelled":
    case "refunded":
      return "warning";
    default:
      return "muted";
  }
}

export function statusLabel(status: string): string {
  const labels: Record<string, string> = {
    pending: "Pending",
    completed: "Completed",
    failed: "Failed",
    cancelled: "Cancelled",
    refunded: "Refunded",
  };
  return labels[status] ?? status;
}
