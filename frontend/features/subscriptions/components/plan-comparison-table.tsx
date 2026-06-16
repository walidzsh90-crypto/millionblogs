import type { Plan } from "../api/subscriptions-api";
import { formatPrice } from "../data/subscription-status";

type PlanComparisonTableProps = {
  plans: Plan[];
};

export function PlanComparisonTable({ plans }: PlanComparisonTableProps) {
  const nonFreePlans = plans.filter((p) => !p.isFree);
  if (nonFreePlans.length === 0) return null;

  const allFeatureKeys = new Set<string>();
  nonFreePlans.forEach((p) => {
    const features = p.features as Record<string, unknown> | null;
    if (features) Object.keys(features).forEach((k) => allFeatureKeys.add(k));
  });
  const sortedFeatures = Array.from(allFeatureKeys).sort();

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border">
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted">
              Feature
            </th>
            {nonFreePlans.map((p) => (
              <th
                key={p.id}
                className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-muted"
              >
                {p.name}
                <p className="mt-0.5 text-base font-bold text-foreground normal-case">
                  {formatPrice(p.price, p.currency)}
                </p>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sortedFeatures.length === 0 ? (
            <tr>
              <td colSpan={nonFreePlans.length + 1} className="px-4 py-8 text-center text-muted">
                No feature details available for comparison.
              </td>
            </tr>
          ) : (
            sortedFeatures.map((feature, idx) => (
              <tr key={feature} className={idx % 2 === 0 ? "bg-background/50" : ""}>
                <td className="px-4 py-3 font-medium text-foreground">{feature}</td>
                {nonFreePlans.map((p) => {
                  const features = p.features as Record<string, unknown> | null;
                  const value = features?.[feature];
                  return (
                    <td key={p.id} className="px-4 py-3 text-center">
                      {value === true || value === "true" ? (
                        <span className="text-success font-bold" aria-label="Included">✓</span>
                      ) : value === false || value === "false" ? (
                        <span className="text-muted" aria-label="Not included">—</span>
                      ) : (
                        <span className="text-foreground">{String(value)}</span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
