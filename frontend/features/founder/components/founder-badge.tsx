export function FounderBadge({ badgeLabel }: { badgeLabel: string }) {
  const colors: Record<string, string> = {
    "Founder Pro": "bg-amber-100 text-amber-800 border-amber-300",
    "Founder Master": "bg-purple-100 text-purple-800 border-purple-300",
  };

  const colorClass = colors[badgeLabel] ?? "bg-promotion/10 text-promotion border-promotion/20";

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold ${colorClass}`}
    >
      <span aria-hidden="true">&#9733;</span>
      {badgeLabel}
    </span>
  );
}

export function FounderBadgeIcon({ badgeLabel, size = "sm" }: { badgeLabel: string; size?: "sm" | "lg" }) {
  const sizeClass = size === "lg" ? "h-16 w-16 text-2xl" : "h-10 w-10 text-base";
  const isMaster = badgeLabel.toLowerCase().includes("master");
  const bgClass = isMaster ? "bg-purple-100 text-purple-700" : "bg-amber-100 text-amber-700";

  return (
    <div
      className={`flex items-center justify-center rounded-full ${bgClass} ${sizeClass}`}
      aria-label={`${badgeLabel} badge`}
    >
      <span aria-hidden="true">{isMaster ? "&#9889;" : "&#9733;"}</span>
    </div>
  );
}
