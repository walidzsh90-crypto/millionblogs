import type { Transaction } from "../api/wallet-api";
import { formatCredits, TRANSACTION_TYPE_CONFIG } from "../data/wallet-config";

type TransactionDetailDialogProps = {
  transaction: Transaction;
  onClose: () => void;
};

export function TransactionDetailDialog({
  transaction,
  onClose,
}: TransactionDetailDialogProps) {
  const typeConfig = TRANSACTION_TYPE_CONFIG[transaction.type];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="tx-detail-title"
    >
      <div className="w-full max-w-md rounded-lg border border-border bg-surface p-6">
        <div className="flex items-center justify-between">
          <h2 id="tx-detail-title" className="text-xl font-semibold text-foreground">
            Transaction details
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1 text-muted hover:text-foreground"
            aria-label="Close"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
              <path d="M5 5l10 10M15 5l-10 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <div className="mt-5 space-y-4">
          <div className="flex items-center justify-between rounded-md bg-muted/10 px-4 py-3">
            <span className="text-sm text-muted">Amount</span>
            <span
              className={`text-lg font-bold ${
                transaction.type === "credit" || transaction.type === "release"
                  ? "text-success"
                  : "text-danger"
              }`}
            >
              {transaction.type === "credit" || transaction.type === "release" ? "+" : "-"}
              {formatCredits(transaction.amount)}
            </span>
          </div>

          <DetailRow label="Type" value={typeConfig.label} />
          <DetailRow label="Source" value={transaction.source} />
          <DetailRow label="Reason" value={transaction.reason ?? "—"} />
          <DetailRow label="Reference" value={transaction.reference ?? "—"} />
          <DetailRow label="Balance before" value={formatCredits(transaction.balanceBefore)} />
          <DetailRow label="Balance after" value={formatCredits(transaction.balanceAfter)} />
          <DetailRow label="ID" value={transaction.id} mono />
          <DetailRow
            label="Date"
            value={new Date(transaction.createdAt).toLocaleString()}
          />
        </div>

        <div className="mt-6 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="min-h-11 rounded-md border border-border px-5 text-sm font-semibold text-foreground"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

function DetailRow({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-2">
      <span className="text-sm text-muted">{label}</span>
      <span
        className={`text-right text-sm text-foreground ${mono ? "font-mono text-xs" : ""}`}
      >
        {value}
      </span>
    </div>
  );
}
