"use client";

import { Camera, SortAsc, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DashboardDesktopNavigation,
  type DashboardTab,
} from "@/components/dashboard-navigation";

type DashboardHeaderProps = {
  readonly activeTab: DashboardTab;
  readonly cardCount: number;
  readonly sortBy: string;
  readonly onCreateCard: () => void;
  readonly onSortChange: (sortBy: string) => void;
  readonly onTabChange: (tab: DashboardTab) => void;
};

const passportMilestones = [3, 5, 10] as const;
const sortOptions = ["newest", "title_asc", "acidity_desc"] as const;

const tabTitles = {
  shelf: "내 원두 아카이브",
  log: "커피 기록",
  passport: "나의 패스포트",
  settings: "설정",
} as const satisfies Record<DashboardTab, string>;

function nextSortOption(currentSort: string): string {
  const currentIndex = sortOptions.findIndex((option) => option === currentSort);
  return sortOptions[(currentIndex + 1) % sortOptions.length] ?? "newest";
}

export function DashboardHeader({
  activeTab,
  cardCount,
  sortBy,
  onCreateCard,
  onSortChange,
  onTabChange,
}: DashboardHeaderProps) {
  const nextMilestone = passportMilestones.find((milestone) => cardCount < milestone) ?? passportMilestones[2];
  const completedCount = Math.min(cardCount, nextMilestone);
  const remainingCount = Math.max(0, nextMilestone - cardCount);
  const progress = (completedCount / nextMilestone) * 100;
  const milestoneLabel = cardCount >= 10 ? "현재 스냅샷 갱신 중" : `${nextMilestone}개까지 ${remainingCount}개`;

  return (
    <header className="coffee-dashboard-header">
      <div className="flex min-w-0 items-center justify-between gap-4">
        <p className="font-serif text-2xl font-black tracking-[-0.04em] text-foreground sm:text-3xl">CoffeeDex</p>

        <div className="flex items-center gap-3">
          <div className="hidden min-w-44 sm:block" aria-label={`패스포트 다음 단계 ${completedCount}/${nextMilestone}`}>
            <div className="flex justify-between text-xs font-bold">
              <span>{milestoneLabel}</span>
              <span className="text-primary-amber">{completedCount} / {nextMilestone}</span>
            </div>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10">
              <div className="h-full rounded-full bg-primary-amber" style={{ width: `${progress}%` }} />
            </div>
          </div>
          <span className="grid size-10 place-items-center rounded-full border border-white/10 bg-white/5 text-muted-foreground">
            <UserRound aria-hidden="true" size={18} />
          </span>
          <Button
            onClick={onCreateCard}
            className="hidden min-h-10 rounded-xl border-0 bg-primary-amber px-4 text-xs font-extrabold text-background-dark hover:bg-primary-amber hover:opacity-90 md:inline-flex"
          >
            <Camera aria-hidden="true" size={15} />
            원두 스캔
          </Button>
        </div>
      </div>

      <div className="mt-5 sm:hidden" aria-label={`패스포트 다음 단계 ${completedCount}/${nextMilestone}`}>
        <div className="flex justify-between text-xs font-bold">
          <span>{milestoneLabel}</span>
          <span className="text-primary-amber">{completedCount} / {nextMilestone}</span>
        </div>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10">
          <div className="h-full rounded-full bg-primary-amber" style={{ width: `${progress}%` }} />
        </div>
      </div>

      <div className="mt-8 flex items-end justify-between gap-4">
        <div>
          {activeTab === "shelf" && (
            <p className="mb-2 text-[11px] font-extrabold uppercase tracking-[0.18em] text-primary-amber">
              나의 Taste Passport
            </p>
          )}
          <h1 className="break-keep font-serif text-4xl font-black leading-none tracking-[-0.05em] text-foreground sm:text-5xl">
            {tabTitles[activeTab]}
          </h1>
          {activeTab === "shelf" && (
            <p className="mt-3 break-keep text-xs font-semibold leading-5 text-muted-foreground">
              기록한 원두들을 찬장에 진열해 보세요. 기록한 원두 {cardCount}봉
            </p>
          )}
        </div>

        {activeTab === "shelf" && (
          <button
            type="button"
            onClick={() => onSortChange(nextSortOption(sortBy))}
            className="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-full border border-white/15 px-4 text-xs font-bold text-muted-foreground transition-colors hover:border-primary-amber/50 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-amber"
          >
            <SortAsc aria-hidden="true" size={16} />
            정렬
          </button>
        )}
      </div>

      <div className="mt-6 border-t border-white/10 pt-3">
        <DashboardDesktopNavigation activeTab={activeTab} onTabChange={onTabChange} />
      </div>
    </header>
  );
}
