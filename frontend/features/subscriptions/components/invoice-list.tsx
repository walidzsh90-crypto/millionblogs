import type { Payment } from "../api/subscriptions-api";
import { formatPrice } from "../data/subscription-status";

type InvoiceListProps = {
  payments: Payment[];
  isLoading: boolean;
};

export function InvoiceList({ payments, isLoading }: InvoiceListProps) {
  if (isLoading) {
    return (
      <div className="grid gap-3" aria-busy="true">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-14 animate-pulse rounded-md bg-muted/20" />
        ))}
      </div>
    );
  }

  if (payments.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-surface p-8 text-center">
        <p className="text-sm text-muted">No payment history yet.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border text-left text-xs font-semibold uppercase tracking-wider text-muted">
            <th className="px-3 py-3">Date</th>
            <th className="px-3 py-3">Amount</th>
            <th className="px-3 py-3">Status</th>
            <th className="px-3 py-3">Plan</th>
          </tr>
        </thead>
        <tbody>
          {payments.map((payment) => (
            <tr key={payment.id} className="border-b border-border/50 text-foreground">
              <td className="whitespace-nowrap px-3 py-3">
                {new Date(payment.createdAt).toLocaleDateString()}
              </td>
              <td className="px-3 py-3 font-medium">
                {formatPrice(payment.amount, payment.currency)}
              </td>
              <td className="px-3 py-3">
                <span
                  className={`inline-block rounded-sm border px-2 py-0.5 text-xs font-semibold ${
                  payment.status === "completed" || payment.status === "paid"
                      ? "border-success/20 bg-success/10 text-success"
                      : payment.status === "failed"
                        ? "border-danger/20 bg-danger/10 text-danger"
                        : payment.status === "refunded"
                          ? "border-warning/20 bg-warning/10 text-warning"
                          : "border-muted/30 bg-muted/20 text-muted"
                  }`}
                >
                  {payment.status}
                </span>
              </td>
              <td className="px-3 py-3 text-muted">
                {payment.stripePaymentId
                  ? payment.stripePaymentId.slice(0, 12) + "..."
                  : "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
