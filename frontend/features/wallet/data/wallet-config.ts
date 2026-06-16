import type { TransactionType } from "../api/wallet-api";

export function formatCredits(amount: number): string {
  return new Intl.NumberFormat("en-US").format(amount);
}

export const TRANSACTION_TYPE_CONFIG: Record<
  TransactionType,
  { label: string; variant: "muted" | "warning" | "success" | "danger" | "promotion" }
> = {
  credit: { label: "Credit", variant: "success" },
  debit: { label: "Debit", variant: "danger" },
  hold: { label: "Hold", variant: "warning" },
  release: { label: "Release", variant: "promotion" },
  refund: { label: "Refund", variant: "warning" },
  adjustment: { label: "Adjustment", variant: "muted" },
};

export const TRANSACTION_FILTER_TABS: { value: string; label: string }[] = [
  { value: "", label: "All" },
  { value: "credit", label: "Credit" },
  { value: "debit", label: "Debit" },
  { value: "hold", label: "Hold" },
  { value: "release", label: "Release" },
  { value: "refund", label: "Refund" },
];
