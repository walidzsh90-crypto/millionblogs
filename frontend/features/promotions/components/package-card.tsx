import type { PromotionPackage } from "../api/promotions-api";

type PackageCardProps = {
  pkg: PromotionPackage;
  onSelect: (pkg: PromotionPackage) => void;
};

export function PackageCard({ pkg, onSelect }: PackageCardProps) {
  return (
    <div className="rounded-lg border border-border bg-surface p-5 transition-colors hover:border-primary/50">
      <h3 className="text-lg font-semibold text-foreground">{pkg.name}</h3>
      {pkg.description && (
        <p className="mt-1 text-sm text-muted">{pkg.description}</p>
      )}
      <div className="mt-4 space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted">Credits</span>
          <span className="font-bold text-foreground">{pkg.creditCost}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted">Duration</span>
          <span className="font-semibold text-foreground">{pkg.duration} days</span>
        </div>
      </div>
      <button
        type="button"
        onClick={() => onSelect(pkg)}
        className="mt-5 w-full rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
      >
        Create campaign
      </button>
    </div>
  );
}
