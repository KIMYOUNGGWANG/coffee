"use client";

import DashboardFiltersPanel from "@/components/dashboard-filters-panel";
import type { RepurchaseFilter } from "@/lib/dashboard-card-filter";

type DashboardShelfFiltersProps = {
  readonly searchQuery: string;
  readonly selectedMethod: string;
  readonly selectedRoast: string;
  readonly selectedRepurchaseIntent: RepurchaseFilter;
  readonly minAcidity: number;
  readonly minSweetness: number;
  readonly minBody: number;
  readonly sortBy: string;
  readonly onSearchQueryChange: (value: string) => void;
  readonly onSearchSubmit: () => void;
  readonly onSelectedMethodChange: (value: string) => void;
  readonly onSelectedRoastChange: (value: string) => void;
  readonly onSelectedRepurchaseIntentChange: (value: RepurchaseFilter) => void;
  readonly onMinAcidityChange: (value: number) => void;
  readonly onMinSweetnessChange: (value: number) => void;
  readonly onMinBodyChange: (value: number) => void;
  readonly onSortByChange: (value: string) => void;
  readonly onReset: () => void;
};

export function DashboardShelfFilters(props: DashboardShelfFiltersProps) {
  return (
    <details className="shelf-filter-shell mb-3 sm:mb-6">
      <summary className="min-h-11 cursor-pointer list-none text-right text-xs font-bold text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-amber">
        검색과 상세 필터
      </summary>
      <div className="pt-3">
        <DashboardFiltersPanel {...props} />
      </div>
    </details>
  );
}
