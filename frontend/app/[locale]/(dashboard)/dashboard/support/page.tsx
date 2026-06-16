"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

import { localizedPath } from "@/i18n/routing";
import { isSupportedLocale, type Locale } from "@/i18n/config";
import { ErrorState } from "@/shared/components/feedback/error-state";
import { Skeleton } from "@/shared/ui/skeleton/skeleton";

import { supportApi, type TicketResponse } from "@/features/support/api/support-api";
import { TicketCard } from "@/features/support/components/ticket-card";
import { TicketFilters } from "@/features/support/components/ticket-filters";
import { ArticlePagination } from "@/features/articles/components/article-pagination";

const PAGE_SIZE = 20;

export default function SupportListPage() {
  const params = useParams();
  const localeParam = String(params.locale ?? "en");
  const locale: Locale = isSupportedLocale(localeParam) ? localeParam : "en";

  const [tickets, setTickets] = useState<TicketResponse[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("");

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const filter: Record<string, unknown> = { page, pageSize: PAGE_SIZE };
      if (activeTab) filter.status = activeTab;

      const data = await supportApi.list(filter as any);
      setTickets(data.items);
      setTotal(data.total);
    } catch (err: any) {
      setError(err?.message ?? "Failed to load tickets");
    } finally {
      setIsLoading(false);
    }
  }, [page, activeTab]);

  useEffect(() => { load(); }, [load]);

  function handleTabChange(tab: string) {
    setActiveTab(tab);
    setPage(1);
  }

  if (error) {
    return (
      <main className="px-4 py-8">
        <ErrorState title="Failed to load tickets" message={error} reset={load} />
      </main>
    );
  }

  return (
    <main className="px-4 py-8">
      <section className="mx-auto w-full max-w-4xl" aria-labelledby="support-list-title">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.14em] text-accent">Support</p>
            <h1 id="support-list-title" className="mt-1 text-3xl font-semibold text-foreground">
              Support Tickets
            </h1>
            <p className="mt-1 text-sm text-muted">
              Contact our support team for assistance.
            </p>
          </div>
          <Link
            href={localizedPath(locale, "/dashboard/support/new")}
            className="inline-flex min-h-11 items-center rounded-md bg-primary px-5 text-sm font-semibold text-white"
          >
            New ticket
          </Link>
        </div>

        <div className="mt-6">
          <TicketFilters activeTab={activeTab} onTabChange={handleTabChange} />
        </div>

        {isLoading ? (
          <div className="mt-6 grid gap-4" aria-busy="true">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        ) : tickets.length === 0 ? (
          <div className="mt-12 text-center">
            <h2 className="text-xl font-semibold text-foreground">No tickets</h2>
            <p className="mt-2 text-sm text-muted">
              {activeTab
                ? `No ${activeTab} support tickets.`
                : "You have not created any support tickets yet."}
            </p>
            <Link
              href={localizedPath(locale, "/dashboard/support/new")}
              className="mt-6 inline-flex min-h-11 items-center rounded-md bg-primary px-5 text-sm font-semibold text-white"
            >
              Create a ticket
            </Link>
          </div>
        ) : (
          <div className="mt-6 grid gap-4">
            {tickets.map((ticket) => (
              <TicketCard key={ticket.id} ticket={ticket} locale={locale} />
            ))}
          </div>
        )}

        {!isLoading && tickets.length > 0 && (
          <div className="mt-6">
            <ArticlePagination
              page={page}
              pageSize={PAGE_SIZE}
              total={total}
              onPageChange={setPage}
            />
          </div>
        )}
      </section>
    </main>
  );
}
