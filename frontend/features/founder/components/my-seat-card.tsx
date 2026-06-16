import type { FounderSeat } from "../api/founder-api";
import { FounderBadge, FounderBadgeIcon } from "./founder-badge";

type MySeatCardProps = {
  seat: FounderSeat;
};

export function MySeatCard({ seat }: MySeatCardProps) {
  return (
    <div className="rounded-lg border-2 border-promotion bg-promotion/5 p-6">
      <div className="flex flex-wrap items-start gap-4">
        <FounderBadgeIcon badgeLabel={seat.badgeLabel} size="lg" />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-semibold text-foreground">{seat.programName}</h2>
            <FounderBadge badgeLabel={seat.badgeLabel} />
          </div>
          <p className="mt-1 text-sm text-muted">
            Claimed on {new Date(seat.claimedAt).toLocaleDateString()}
          </p>
        </div>
      </div>
    </div>
  );
}
