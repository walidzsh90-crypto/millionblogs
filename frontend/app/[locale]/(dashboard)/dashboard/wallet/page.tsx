"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

import { isSupportedLocale } from "@/i18n/config";
import { localizedPath } from "@/i18n/routing";
import { ErrorState } from "@/shared/components/feedback/error-state";
import { Skeleton } from "@/shared/ui/skeleton/skeleton";

import { walletApi, type BalanceResponse, type Transaction, type TransactionType } from "@/features/wallet/api/wallet-api";
import { BalanceCard } from "@/features/wallet/components/balance-card";
import { TransactionFilters } from "@/features/wallet/components/transaction-filters";
import { TransactionList } from "@/features/wallet/components/transaction-list";
import { TransactionDetailDialog } from "@/features/wallet/components/transaction-detail-dialog";

export default function WalletPage() {
  const { locale: localeParam } = useParams<{ locale: string }>();
  const locale = isSupportedLocale(localeParam ?? "en") ? localeParam : "en";
  const [balance, setBalance] = useState<BalanceResponse | null>(null);
  const [heldAmount, setHeldAmount] = useState<number | undefined>(undefined);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [typeFilter, setTypeFilter] = useState<TransactionType | "">("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);

  const loadBalance = useCallback(async () => {
    const balanceData = await walletApi.getBalance();
    setBalance(balanceData);
  }, []);

  const loadHeldAmount = useCallback(async () => {
    try {
      const [heldRes, releasedRes] = await Promise.all([
        walletApi.transactions({ type: "hold", pageSize: 100 }),
        walletApi.transactions({ type: "release", pageSize: 100 }),
      ]);
      const held = heldRes.items.reduce((sum, t) => sum + t.amount, 0);
      const released = releasedRes.items.reduce((sum, t) => sum + t.amount, 0);
      setHeldAmount(Math.max(0, held - released));
    } catch {
      // non-critical
    }
  }, []);

  const loadTransactions = useCallback(async () => {
    const filter: Record<string, unknown> = { page, pageSize };
    if (typeFilter) filter.type = typeFilter;
    const result = await walletApi.transactions(
      filter as { type?: TransactionType; page?: number; pageSize?: number }
    );
    setTransactions(result.items);
    setTotal(result.total);
  }, [page, pageSize, typeFilter]);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      await Promise.all([loadBalance(), loadHeldAmount(), loadTransactions()]);
    } catch (err: any) {
      setError(err?.message ?? "Failed to load wallet");
    } finally {
      setIsLoading(false);
    }
  }, [loadBalance, loadHeldAmount, loadTransactions]);

  useEffect(() => { load(); }, [load]);

  function handleFilterChange(value: TransactionType | "") {
    setTypeFilter(value);
    setPage(1);
  }

  function handlePageChange(newPage: number) {
    setPage(newPage);
  }

  if (error && !balance) {
    return (
      <main className="px-4 py-8">
        <ErrorState title="Failed to load wallet" message={error} reset={load} />
      </main>
    );
  }

  return (
    <main className="px-4 py-8">
      {selectedTx && (
        <TransactionDetailDialog
          transaction={selectedTx}
          onClose={() => setSelectedTx(null)}
        />
      )}

      <section className="mx-auto w-full max-w-6xl" aria-labelledby="wallet-title">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.14em] text-accent">Wallet</p>
          <h1 id="wallet-title" className="mt-1 text-3xl font-semibold text-foreground">
            Wallet
          </h1>
          <p className="mt-1 text-sm text-muted">
            View your credit balance and transaction history.
          </p>
        </div>

        <div className="mt-6 flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            {balance ? (
              <BalanceCard
                totalBalance={balance.totalBalance}
                purchasedBalance={balance.purchasedBalance}
                bonusBalance={balance.bonusBalance}
                heldAmount={heldAmount}
              />
            ) : isLoading ? (
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4" aria-busy="true">
            <Skeleton className="h-28 w-full" />
            <Skeleton className="h-28 w-full" />
            <Skeleton className="h-28 w-full" />
            <Skeleton className="h-28 w-full" />
          </div>
        ) : null}
          </div>

          <Link
            href={localizedPath(locale, "/dashboard/purchase")}
            className="shrink-0 rounded-md bg-primary px-5 py-2.5 text-sm font-semibold text-white"
          >
            Buy Credits
          </Link>
        </div>

        <div className="mt-8">
          <h2 className="text-lg font-semibold text-foreground">Transaction history</h2>
          <div className="mt-3">
            <TransactionFilters active={typeFilter} onChange={handleFilterChange} />
          </div>
          <div className="mt-4">
            <TransactionList
              transactions={transactions}
              total={total}
              page={page}
              pageSize={pageSize}
              isLoading={isLoading}
              onPageChange={handlePageChange}
              onSelect={setSelectedTx}
            />
          </div>
        </div>

        {!isLoading && balance && transactions.length === 0 && !typeFilter && (
          <div className="mt-12 text-center">
            <h2 className="text-xl font-semibold text-foreground">No activity yet</h2>
            <p className="mt-2 text-sm text-muted">
              Your wallet is ready. Credits will appear here once you make a purchase or
              receive a bonus.
            </p>
          </div>
        )}
      </section>
    </main>
  );
}
