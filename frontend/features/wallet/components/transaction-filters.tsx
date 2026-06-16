import { TRANSACTION_FILTER_TABS } from "../data/wallet-config";
import type { TransactionType } from "../api/wallet-api";

type TransactionFiltersProps = {
  active: TransactionType | "";
  onChange: (value: TransactionType | "") => void;
};

export function TransactionFilters({ active, onChange }: TransactionFiltersProps) {
  return (
    <div className="flex flex-wrap gap-2" role="tablist" aria-label="Transaction type filter">
      {TRANSACTION_FILTER_TABS.map((tab) => (
        <button
          key={tab.value}
          role="tab"
          type="button"
          aria-selected={active === tab.value}
          onClick={() => onChange(tab.value as TransactionType | "")}
          className={`rounded-md px-3 py-1.5 text-sm font-semibold transition-colors ${
            active === tab.value
              ? "bg-primary text-white"
              : "bg-muted/10 text-muted hover:bg-muted/20"
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
