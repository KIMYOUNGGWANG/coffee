"use client";

import AIBaristaPanel from "@/components/ai-barista-panel";
import DashboardAnalyticsPanel from "@/components/dashboard-analytics-panel";
import DashboardRoasterMemoryPanel from "@/components/dashboard-roaster-memory-panel";
import type { TasteAnalyticsData, TastingCardData } from "@/hooks/useTastingCards";

type DashboardPassportViewProps = {
  readonly analytics: TasteAnalyticsData | undefined;
  readonly cards: readonly TastingCardData[] | undefined;
  readonly isLoading: boolean;
  readonly refreshTrigger: number;
};

export function DashboardPassportView({
  analytics,
  cards,
  isLoading,
  refreshTrigger,
}: DashboardPassportViewProps) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <DashboardAnalyticsPanel analytics={analytics} isLoading={isLoading} />
      <DashboardRoasterMemoryPanel cards={cards} />
      <div className="lg:col-span-2">
        <AIBaristaPanel refreshTrigger={refreshTrigger} />
      </div>
    </div>
  );
}
