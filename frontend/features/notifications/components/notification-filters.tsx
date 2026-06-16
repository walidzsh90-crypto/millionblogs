"use client";

import { NOTIFICATION_FILTER_TABS } from "../data/notification-types";

type NotificationFiltersProps = {
  activeTab: string;
  unreadCount: number;
  onTabChange: (tab: string) => void;
};

export function NotificationFilters({
  activeTab,
  unreadCount,
  onTabChange,
}: NotificationFiltersProps) {
  return (
    <div className="flex flex-wrap items-center gap-2" role="tablist" aria-label="Notification filters">
      {NOTIFICATION_FILTER_TABS.map((tab) => (
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
          {tab.value === "unread" && unreadCount > 0 && (
            <span className="ml-1.5 rounded-full bg-danger px-1.5 py-0.5 text-xs text-white">
              {unreadCount}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}
