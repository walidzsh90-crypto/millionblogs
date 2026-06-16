"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";

import { isSupportedLocale, type Locale } from "@/i18n/config";
import { ErrorState } from "@/shared/components/feedback/error-state";
import { Skeleton } from "@/shared/ui/skeleton/skeleton";

import {
  founderApi,
  type FounderProgram,
  type FounderSeat,
} from "@/features/founder/api/founder-api";
import { FounderProgramCard } from "@/features/founder/components/founder-program-card";
import { MySeatCard } from "@/features/founder/components/my-seat-card";
import { ClaimDialog } from "@/features/founder/components/claim-dialog";
import { UpgradeDialog } from "@/features/founder/components/upgrade-dialog";

export default function FounderPage() {
  const params = useParams();
  const localeParam = String(params.locale ?? "en");
  const locale: Locale = isSupportedLocale(localeParam) ? localeParam : "en";

  const [programs, setPrograms] = useState<FounderProgram[]>([]);
  const [mySeat, setMySeat] = useState<FounderSeat | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [claimTarget, setClaimTarget] = useState<FounderProgram | null>(null);
  const [upgradeTarget, setUpgradeTarget] = useState<FounderProgram | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const currentProgram = mySeat
    ? programs.find((p) => p.id === mySeat.programId) ?? null
    : null;

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [programsData, seatData] = await Promise.all([
        founderApi.programs(),
        founderApi.mySeat().catch(() => null),
      ]);
      setPrograms(programsData);
      setMySeat(seatData);
    } catch (err: any) {
      setError(err?.message ?? "Failed to load founder programs");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleClaim(programId: string) {
    setIsSubmitting(true);
    setActionError(null);
    try {
      const seat = await founderApi.claim(programId);
      setMySeat(seat);
      setClaimTarget(null);
      const [programsData] = await Promise.all([founderApi.programs()]);
      setPrograms(programsData);
    } catch (err: any) {
      setActionError(err?.message ?? "Failed to claim seat");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleUpgrade(targetProgramId: string) {
    setIsSubmitting(true);
    setActionError(null);
    try {
      const seat = await founderApi.upgrade(targetProgramId);
      setMySeat(seat);
      setUpgradeTarget(null);
      const [programsData] = await Promise.all([founderApi.programs()]);
      setPrograms(programsData);
    } catch (err: any) {
      setActionError(err?.message ?? "Failed to upgrade seat");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (error) {
    return (
      <main className="px-4 py-8">
        <ErrorState title="Failed to load founder programs" message={error} reset={load} />
      </main>
    );
  }

  return (
    <main className="px-4 py-8">
      {claimTarget && (
        <ClaimDialog
          program={claimTarget}
          onConfirm={() => handleClaim(claimTarget.id)}
          onCancel={() => { setClaimTarget(null); setActionError(null); }}
          isSubmitting={isSubmitting}
          error={actionError}
        />
      )}

      {upgradeTarget && currentProgram && (
        <UpgradeDialog
          currentProgram={currentProgram}
          targetProgram={upgradeTarget}
          onConfirm={() => handleUpgrade(upgradeTarget.id)}
          onCancel={() => { setUpgradeTarget(null); setActionError(null); }}
          isSubmitting={isSubmitting}
          error={actionError}
        />
      )}

      <section className="mx-auto w-full max-w-5xl" aria-labelledby="founder-title">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.14em] text-accent">Founder</p>
          <h1 id="founder-title" className="mt-1 text-3xl font-semibold text-foreground">
            Founder Program
          </h1>
          <p className="mt-1 text-sm text-muted">
            Join the MillionBlogs Founder Program and unlock exclusive benefits.
          </p>
        </div>

        {isLoading ? (
          <div className="mt-8 grid gap-6 md:grid-cols-2" aria-busy="true">
            <Skeleton className="h-72 w-full" />
            <Skeleton className="h-72 w-full" />
          </div>
        ) : (
          <>
            {mySeat && (
              <div className="mt-8">
                <MySeatCard seat={mySeat} />
              </div>
            )}

            {programs.length === 0 ? (
              <div className="mt-12 text-center">
                <h2 className="text-xl font-semibold text-foreground">No programs available</h2>
                <p className="mt-2 text-sm text-muted">
                  There are no founder programs open at this time.
                </p>
              </div>
            ) : (
              <div className="mt-8 grid gap-6 md:grid-cols-2">
                {programs.map((program) => (
                  <FounderProgramCard
                    key={program.id}
                    program={program}
                    mySeat={mySeat}
                    isUpgradeTarget={
                      !!mySeat &&
                      mySeat.programId !== program.id &&
                      program.status === "open" &&
                      program.remainingSeats > 0
                    }
                    onClaim={(id) => {
                      const p = programs.find((pr) => pr.id === id);
                      if (p) setClaimTarget(p);
                    }}
                    onUpgrade={(id) => {
                      const p = programs.find((pr) => pr.id === id);
                      if (p) setUpgradeTarget(p);
                    }}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </section>
    </main>
  );
}
