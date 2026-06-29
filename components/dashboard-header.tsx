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
        <div className="min-w-0">
          <p className="coffee-kicker">CoffeeDex room</p>
          <h2 className="mt-3 break-keep font-serif text-2xl font-black tracking-tight text-background-dark sm:text-3xl">개인 커피룸</h2>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden min-w-44 sm:block" aria-label={`패스포트 다음 단계 ${completedCount}/${nextMilestone}`}>
            <div className="flex justify-between text-xs font-black text-background-dark">
              <span>{milestoneLabel}</span>
              <span className="text-primary-amber">{completedCount} / {nextMilestone}</span>
            </div>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-background-dark/10">
              <div className="h-full rounded-full bg-primary-amber" style={{ width: `${progress}%` }} />
            </div>
          </div>
          <span className="grid size-10 place-items-center rounded-full border border-background-dark/10 bg-white/45 text-background-dark/70 shadow-sm">
            <UserRound aria-hidden="true" size={18} />
          </span>
          <Button
            onClick={onCreateCard}
            className="coffee-pill-button hidden border-0 px-4 md:inline-flex"
          >
            <Camera aria-hidden="true" size={15} />
            원두 스캔
          </Button>
        </div>
      </div>

      <div className="premium-card mt-6 flex flex-col gap-5 p-4 sm:hidden" aria-label={`패스포트 다음 단계 ${completedCount}/${nextMilestone}`}>
        <div className="flex justify-between items-center px-2">
          {[
            { label: "기록", value: cardCount.toString().padStart(2, "0") },
            { label: "다음", value: remainingCount.toString().padStart(2, "0") },
            { label: "등급", value: `${completedCount}/${nextMilestone}` },
          ].map((item) => (
            <div key={item.label} className="flex flex-col text-center">
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{item.label}</p>
              <p className="mt-1.5 font-serif text-2xl font-black text-background-dark">{item.value}</p>
            </div>
          ))}
        </div>
        <div className="w-full px-2">
          <div className="flex justify-between text-[11px] font-black text-muted-foreground mb-2">
            <span>{milestoneLabel}</span>
            <span className="text-primary-amber">{Math.round(progress)}%</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-background-dark/10">
            <div className="h-full rounded-full bg-primary-amber" style={{ width: `${progress}%` }} />
          </div>
        </div>
      </div>

      <div className="mt-7 flex items-end justify-between gap-4">
        <div>
          {activeTab === "shelf" && (
            <p className="mb-3 text-[10px] font-black uppercase tracking-[0.18em] text-primary-amber">memory and rebuy system</p>
          )}
          <h1 className="break-keep font-serif text-4xl font-black leading-[1.05] tracking-tight text-background-dark sm:text-6xl">
            {tabTitles[activeTab]}
          </h1>
          {activeTab === "shelf" && (
            <p className="mt-4 max-w-2xl break-keep text-sm font-semibold leading-7 text-muted-foreground">
              기억한 맛, 지금 가진 원두, 다음 구매 신호를 한 화면에서 이어봅니다. 기록한 원두 {cardCount}봉
            </p>
          )}
        </div>

        {activeTab === "shelf" && (
          <button
            type="button"
            onClick={() => onSortChange(nextSortOption(sortBy))}
            className="coffee-chip inline-flex shrink-0 items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-amber"
          >
            <SortAsc aria-hidden="true" size={16} />
            정렬
          </button>
        )}
      </div>

      <div className="mt-6 border-t border-background-dark/10 pt-3">
        <DashboardDesktopNavigation activeTab={activeTab} onTabChange={onTabChange} />
      </div>
    </header>
  );
}
