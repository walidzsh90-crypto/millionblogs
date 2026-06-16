import type { Transaction } from "../api/wallet-api";
import { formatCredits, TRANSACTION_TYPE_CONFIG } from "../data/wallet-config";

type TransactionListProps = {
  transactions: Transaction[];
  total: number;
  page: number;
  pageSize: number;
  isLoading: boolean;
  onPageChange: (page: number) => void;
  onSelect: (tx: Transaction) => void;
};

export function TransactionList({
  transactions,
  total,
  page,
  pageSize,
  isLoading,
  onPageChange,
  onSelect,
}: TransactionListProps) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  if (isLoading) {
    return (
      <div className="space-y-3" aria-busy="true">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-16 animate-pulse rounded-lg bg-muted/20" />
        ))}
      </div>
    );
  }

  if (transactions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-12 text-center">
        <svg width="40" height="40" viewBox="0 0 40 40" fill="none" aria-hidden="true" className="mb-4 text-muted">
          <rect x="4" y="10" width="32" height="22" rx="2" stroke="currentColor" strokeWidth="2" />
          <path d="M4 16h32" stroke="currentColor" strokeWidth="2" />
          <rect x="10" y="20" width="8" height="4" rx="1" fill="currentColor" opacity="0.3" />
        </svg>
        <p className="text-sm font-semibold text-foreground">No transactions found</p>
        <p className="mt-1 text-xs text-muted">
          Transactions will appear here once you purchase credits or use wallet funds.
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="divide-y divide-border rounded-lg border border-border">
        {transactions.map((tx) => {
          const typeConfig = TRANSACTION_TYPE_CONFIG[tx.type];
          const isCredit = tx.type === "credit" || tx.type === "release";
          return (
            <button
              key={tx.id}
              type="button"
              onClick={() => onSelect(tx)}
              className="flex w-full items-center justify-between px-4 py-3 text-left transition-colors hover:bg-muted/10"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-foreground">
                    {typeConfig.label}
                  </span>
                  <span className="rounded-sm border border-border/50 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-muted">
                    {tx.source}
                  </span>
                </div>
                <p className="mt-0.5 truncate text-xs text-muted">
                  {tx.reason ?? new Date(tx.createdAt).toLocaleDateString()}
                </p>
              </div>
              <span
                className={`ml-4 shrink-0 text-sm font-bold ${
                  isCredit ? "text-success" : "text-danger"
                }`}
              >
                {isCredit ? "+" : "-"}
                {formatCredits(tx.amount)}
              </span>
            </button>
          );
        })}
      </div>

      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between">
          <p className="text-xs text-muted">
            Page {page} of {totalPages} ({total} total)
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => onPageChange(page - 1)}
              className="rounded-md border border-border px-3 py-1.5 text-sm font-semibold text-foreground disabled:opacity-40"
            >
              Previous
            </button>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => onPageChange(page + 1)}
              className="rounded-md border border-border px-3 py-1.5 text-sm font-semibold text-foreground disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
