import type { CreditPackConfig } from "../data/purchase-config";
import { formatPrice } from "../data/purchase-config";

type CreditPackCardProps = {
  pack: CreditPackConfig;
  selected: boolean;
  onSelect: () => void;
};

export function CreditPackCard({ pack, selected, onSelect }: CreditPackCardProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`relative flex flex-col rounded-lg border-2 p-5 text-start transition-all ${
        selected
          ? "border-primary bg-primary/5 shadow-sm"
          : "border-border bg-surface hover:border-primary/40"
      }`}
      aria-pressed={selected}
      aria-label={`${pack.name}: ${pack.credits} credits for ${formatPrice(pack.priceCents, pack.currency)}`}
    >
      {pack.popular ? (
        <span className="absolute -top-2.5 right-4 rounded-full bg-primary px-3 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white">
          Best value
        </span>
      ) : null}

      <p className="text-xs font-semibold uppercase tracking-wider text-muted">{pack.name}</p>
      <p className="mt-1 text-4xl font-bold text-foreground">{pack.credits.toLocaleString()}</p>
      <p className="text-xs text-muted">credits</p>

      <p className="mt-4 text-2xl font-semibold text-foreground">{formatPrice(pack.priceCents, pack.currency)}</p>

      <p className="mt-2 text-sm leading-5 text-muted">{pack.description}</p>

      <div
        className={`mt-5 rounded-md px-4 py-2.5 text-center text-sm font-semibold transition-colors ${
          selected
            ? "bg-primary text-white"
            : "border border-border text-foreground"
        }`}
      >
        {selected ? "Selected" : "Select"}
      </div>
    </button>
  );
}
