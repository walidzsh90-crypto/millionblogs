"use client";

import { TICKET_FILTER_TABS } from "../data/ticket-status";

type TicketFiltersProps = {
  activeTab: string;
  onTabChange: (tab: string) => void;
};

export function TicketFilters({ activeTab, onTabChange }: TicketFiltersProps) {
  return (
    <div className="flex flex-wrap items-center gap-2" role="tablist" aria-label="Ticket filters">
      {TICKET_FILTER_TABS.map((tab) => (
        <button
          key={tab.value}
          type="button"
          role="tab"
          aria-selected={activeTab === tab.value}
          onClick={() => onTabChange(tab.value)}
          className={`rounded-md px-4 py-2 text-sm font-semibold transition-colors ${
            activeTab === tab.value
              ? "bg-primary text-white"
              : "border border-border text-foreground hover:bg-muted/20"
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
