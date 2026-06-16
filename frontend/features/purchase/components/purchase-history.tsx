"use client";

import { useCallback, useEffect, useState } from "react";

import { purchaseApi, type Payment } from "../api/purchase-api";
import { formatPrice, statusVariant, statusLabel } from "../data/purchase-config";

export function PurchaseHistory() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await purchaseApi.listPayments({ page, pageSize });
      setPayments(result.items);
      setTotal(result.total);
    } catch (err: any) {
      setError(err?.message ?? "Failed to load purchase history");
    } finally {
      setIsLoading(false);
    }
  }, [page, pageSize]);

  useEffect(() => { load(); }, [load]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  if (isLoading) {
    return (
      <div className="space-y-3" aria-busy="true">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-14 animate-pulse rounded-lg bg-muted/20" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-danger/30 bg-danger/5 p-4 text-sm text-danger" role="alert">
        {error}
        <button
          type="button"
          onClick={load}
          className="ml-2 underline"
        >
          Retry
        </button>
      </div>
    );
  }

  if (payments.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border py-8 text-center">
        <p className="text-sm text-muted">No purchases yet.</p>
      </div>
    );
  }

  const variantClass: Record<string, string> = {
    success: "bg-success/10 text-success",
    danger: "bg-danger/10 text-danger",
    warning: "bg-warning/10 text-warning",
    muted: "bg-muted/10 text-muted",
  };

  return (
    <div>
      <div className="divide-y divide-border rounded-lg border border-border">
        {payments.map((payment) => {
          const variant = statusVariant(payment.status);
          return (
            <div key={payment.id} className="flex items-center justify-between px-4 py-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-foreground">
                    {payment.creditsPurchased
                      ? `${payment.creditsPurchased.toLocaleString()} credits`
                      : `${formatPrice(payment.amount, payment.currency)}`}
                  </span>
                  <span className={`rounded-sm px-1.5 py-0.5 text-[10px] font-semibold uppercase ${variantClass[variant]}`}>
                    {statusLabel(payment.status)}
                  </span>
                </div>
                <p className="mt-0.5 text-xs text-muted">
                  {new Date(payment.createdAt).toLocaleDateString()}
                  {payment.amount ? ` \u2022 ${formatPrice(payment.amount, payment.currency)}` : ""}
                </p>
              </div>
              {payment.creditsPurchased ? (
                <span className="ml-4 shrink-0 text-sm font-semibold text-success">
                  +{payment.creditsPurchased.toLocaleString()}
                </span>
              ) : null}
            </div>
          );
        })}
      </div>

      {totalPages > 1 ? (
        <div className="mt-4 flex items-center justify-between">
          <p className="text-xs text-muted">
            Page {page} of {totalPages} ({total} total)
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
              className="rounded-md border border-border px-3 py-1.5 text-sm font-semibold text-foreground disabled:opacity-40"
            >
              Previous
            </button>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => setPage(page + 1)}
              className="rounded-md border border-border px-3 py-1.5 text-sm font-semibold text-foreground disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
