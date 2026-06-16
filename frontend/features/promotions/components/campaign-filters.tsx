import { CAMPAIGN_FILTER_TABS } from "../data/promotions-config";
import type { CampaignStatus } from "../api/promotions-api";

type CampaignFiltersProps = {
  active: CampaignStatus | "";
  onChange: (value: CampaignStatus | "") => void;
};

export function CampaignFilters({ active, onChange }: CampaignFiltersProps) {
  return (
    <div className="flex flex-wrap gap-2" role="tablist" aria-label="Campaign status filter">
      {CAMPAIGN_FILTER_TABS.map((tab) => (
        <button
          key={tab.value}
          role="tab"
          type="button"
          aria-selected={active === tab.value}
          onClick={() => onChange(tab.value as CampaignStatus | "")}
          className={`rounded-md px-3 py-1.5 text-sm font-semibold transition-colors ${
            active === tab.value
              ? "bg-primary text-white"
              : "bg-muted/10 text-muted hover:bg-muted/20"
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
