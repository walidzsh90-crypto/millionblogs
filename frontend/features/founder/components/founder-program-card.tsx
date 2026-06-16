"use client";

import type { FounderProgram, FounderSeat } from "../api/founder-api";
import { formatPrice, seatUsagePercent } from "../data/founder-config";
import { FounderBadge } from "./founder-badge";

type FounderProgramCardProps = {
  program: FounderProgram;
  mySeat: FounderSeat | null;
  isUpgradeTarget: boolean;
  onClaim: (programId: string) => void;
  onUpgrade: (programId: string) => void;
};

export function FounderProgramCard({
  program,
  mySeat,
  isUpgradeTarget,
  onClaim,
  onUpgrade,
}: FounderProgramCardProps) {
  const usagePercent = seatUsagePercent(program.usedSeats, program.totalSeats);
  const isOwnProgram = mySeat?.programId === program.id;
  const isFull = program.remainingSeats <= 0 || program.status === "closed";
  const isLocked = program.status === "closed";
  const hasSeat = !!mySeat;

  const benefitList = program.benefits as Record<string, boolean | string> | null;

  return (
    <article
      className={`rounded-lg border-2 p-6 ${
        isOwnProgram
          ? "border-promotion bg-promotion/5"
          : isFull
            ? "border-border bg-surface/50 opacity-70"
            : "border-border bg-surface"
      }`}
      aria-labelledby={`program-${program.slug}-title`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h2
              id={`program-${program.slug}-title`}
              className="text-2xl font-semibold text-foreground"
            >
              {program.name}
            </h2>
            {isOwnProgram && (
              <span className="rounded-md bg-promotion/10 px-2 py-0.5 text-xs font-semibold text-promotion">
                Your seat
              </span>
            )}
          </div>
          <p className="mt-1 text-3xl font-bold text-foreground">
            {formatPrice(program.price, program.currency)}
          </p>
          <div className="mt-2">
            <FounderBadge badgeLabel={program.badgeLabel} />
          </div>
        </div>
      </div>

      <div className="mt-4">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted">Seats available</span>
          <span className="font-semibold text-foreground">
            {program.remainingSeats} / {program.totalSeats}
          </span>
        </div>
        <div className="mt-1.5 h-2.5 w-full overflow-hidden rounded-full bg-muted/20">
          <div
            className={`h-full rounded-full transition-all ${
              usagePercent >= 90
                ? "bg-danger"
                : usagePercent >= 70
                  ? "bg-warning"
                  : "bg-success"
            }`}
            style={{ width: `${usagePercent}%` }}
            role="progressbar"
            aria-valuenow={program.usedSeats}
            aria-valuemin={0}
            aria-valuemax={program.totalSeats}
            aria-label={`${usagePercent}% of seats filled`}
          />
        </div>
      </div>

      {benefitList && Object.keys(benefitList).length > 0 && (
        <div className="mt-4">
          <h3 className="text-sm font-semibold text-foreground">Benefits</h3>
          <ul className="mt-2 space-y-1.5">
            {Object.entries(benefitList).map(([key, value]) => (
              <li key={key} className="flex items-center gap-2 text-sm text-muted">
                <span aria-hidden="true" className="text-success">&#10003;</span>
                {typeof value === "string" ? value : key}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-6 flex flex-wrap gap-3">
        {isLocked && (
          <span className="rounded-md border border-border px-4 py-2 text-sm text-muted">
            Program closed
          </span>
        )}
        {isFull && !isLocked && (
          <span className="rounded-md border border-border px-4 py-2 text-sm text-muted">
            All seats filled
          </span>
        )}
        {isOwnProgram && hasSeat && (
          <span className="rounded-md bg-promotion/10 px-4 py-2 text-sm font-semibold text-promotion">
            Active
          </span>
        )}
        {!isOwnProgram && !isFull && !hasSeat && (
          <button
            type="button"
            onClick={() => onClaim(program.id)}
            className="rounded-md bg-primary px-5 py-2.5 text-sm font-semibold text-white"
          >
            Claim seat
          </button>
        )}
        {isUpgradeTarget && hasSeat && !isOwnProgram && !isFull && (
          <button
            type="button"
            onClick={() => onUpgrade(program.id)}
            className="rounded-md bg-promotion px-5 py-2.5 text-sm font-semibold text-white"
          >
            Upgrade to {program.name}
          </button>
        )}
      </div>
    </article>
  );
}
