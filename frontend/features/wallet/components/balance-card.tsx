import { formatCredits } from "../data/wallet-config";

type BalanceCardProps = {
  totalBalance: number;
  purchasedBalance: number;
  bonusBalance: number;
  heldAmount?: number;
};

export function BalanceCard({
  totalBalance,
  purchasedBalance,
  bonusBalance,
  heldAmount,
}: BalanceCardProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <div className="rounded-lg border-2 border-primary/20 bg-primary/5 p-5">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted">Total balance</p>
        <p className="mt-1 text-3xl font-bold text-foreground">{formatCredits(totalBalance)}</p>
        <p className="text-xs text-muted">credits</p>
      </div>

      <div className="rounded-lg border border-border bg-surface p-5">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted">Purchased</p>
        <p className="mt-1 text-2xl font-bold text-success">{formatCredits(purchasedBalance)}</p>
        <p className="text-xs text-muted">credits</p>
      </div>

      <div className="rounded-lg border border-border bg-surface p-5">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted">Bonus</p>
        <p className="mt-1 text-2xl font-bold text-promotion">{formatCredits(bonusBalance)}</p>
        <p className="text-xs text-muted">credits</p>
      </div>

      <div className="rounded-lg border border-border bg-surface p-5">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted">Held</p>
        <p className="mt-1 text-2xl font-bold text-warning">
          {heldAmount !== undefined ? formatCredits(heldAmount) : "—"}
        </p>
        <p className="text-xs text-muted">credits</p>
      </div>
    </div>
  );
}
