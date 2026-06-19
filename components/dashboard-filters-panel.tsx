"use client";

import { RotateCcw, Search, SlidersHorizontal } from "lucide-react";
import type { FormEvent } from "react";
import type { RepurchaseFilter } from "@/lib/dashboard-card-filter";

type DashboardFiltersPanelProps = {
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

const availableMethods = ["Hario V60", "Kalita Wave", "Espresso", "AeroPress", "Origami Dripper", "French Press", "Cold Brew"] as const;
const repurchaseOptions = [
  { value: "", label: "전체" },
  { value: "again", label: "다시 살래요" },
  { value: "maybe", label: "고민 중" },
  { value: "no", label: "다시 안 사요" },
  { value: "undecided", label: "미정" },
] as const satisfies readonly { readonly value: RepurchaseFilter; readonly label: string }[];

export default function DashboardFiltersPanel({
  searchQuery,
  selectedMethod,
  selectedRoast,
  selectedRepurchaseIntent,
  minAcidity,
  minSweetness,
  minBody,
  sortBy,
  onSearchQueryChange,
  onSearchSubmit,
  onSelectedMethodChange,
  onSelectedRoastChange,
  onSelectedRepurchaseIntentChange,
  onMinAcidityChange,
  onMinSweetnessChange,
  onMinBodyChange,
  onSortByChange,
  onReset,
}: DashboardFiltersPanelProps) {
  const hasFilter = Boolean(
    searchQuery || selectedMethod || selectedRoast || selectedRepurchaseIntent
    || minAcidity > 1 || minSweetness > 1 || minBody > 1 || sortBy !== "newest",
  );
  const submitSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSearchSubmit();
  };

  return (
    <section className="glass-card mb-6 space-y-4 rounded-3xl border border-white/10 p-4 shadow-sm sm:p-5" aria-labelledby="memory-retrieval-title">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Search aria-hidden="true" size={16} className="text-primary-amber" />
          <h2 id="memory-retrieval-title" className="font-serif text-base font-bold text-foreground">내 커피 다시 찾기</h2>
        </div>
        {hasFilter && (
          <button
            type="button"
            onClick={onReset}
            className="inline-flex min-h-11 items-center gap-1.5 rounded-full px-3 text-xs font-bold text-primary-amber transition-colors hover:bg-white/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-amber"
            aria-label="검색과 필터 초기화"
          >
            <RotateCcw aria-hidden="true" size={13} />
            초기화
          </button>
        )}
      </div>

      <form onSubmit={submitSearch} role="search" className="flex gap-2">
        <label htmlFor="dashboard-memory-search" className="sr-only">커피 기억 검색</label>
        <div className="relative min-w-0 flex-1">
          <Search aria-hidden="true" size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            id="dashboard-memory-search"
            type="search"
            value={searchQuery}
            onChange={(event) => onSearchQueryChange(event.target.value)}
            placeholder="원두, 로스터리, 원산지, 가공 방식, 메모 검색"
            className="min-h-12 w-full rounded-2xl border border-white/10 bg-black/20 py-3 pl-10 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary-amber"
          />
        </div>
        <button
          type="submit"
          className="min-h-12 shrink-0 rounded-2xl bg-primary-amber px-4 text-sm font-black text-background-dark transition-[background-color,transform] hover:bg-primary-amber/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-amber focus-visible:ring-offset-2 focus-visible:ring-offset-background-dark active:scale-[0.98]"
        >
          찾기
        </button>
      </form>

      <fieldset>
        <legend className="mb-2 text-xs font-bold text-muted-foreground">재구매 생각</legend>
        <div className="flex gap-2 overflow-x-auto pb-1" aria-label="재구매 생각 필터">
          {repurchaseOptions.map((option) => {
            const isSelected = selectedRepurchaseIntent === option.value;
            return (
              <button
                key={option.value || "all"}
                type="button"
                aria-pressed={isSelected}
                onClick={() => onSelectedRepurchaseIntentChange(option.value)}
                className={isSelected
                  ? "min-h-11 shrink-0 rounded-full border border-primary-amber bg-primary-amber/15 px-3.5 text-xs font-black text-primary-amber focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-amber"
                  : "min-h-11 shrink-0 rounded-full border border-white/10 bg-white/5 px-3.5 text-xs font-bold text-muted-foreground transition-colors hover:border-white/20 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-amber"}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      </fieldset>

      <details className="group border-t border-white/10 pt-3">
        <summary className="flex min-h-11 cursor-pointer list-none items-center gap-2 text-xs font-bold text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-amber">
          <SlidersHorizontal aria-hidden="true" size={14} className="text-primary-amber" />
          맛과 추출 조건 더 보기
        </summary>
        <div className="grid gap-4 pt-3 sm:grid-cols-2 xl:grid-cols-4">
          <label className="space-y-1.5 text-xs font-bold text-muted-foreground">
            <span>추출 도구</span>
            <select value={selectedMethod} onChange={(event) => onSelectedMethodChange(event.target.value)} className="min-h-11 w-full rounded-xl border border-white/10 bg-black/20 px-3 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary-amber">
              <option value="">전체 도구</option>
              {availableMethods.map((method) => <option key={method} value={method}>{method}</option>)}
            </select>
          </label>
          <label className="space-y-1.5 text-xs font-bold text-muted-foreground">
            <span>로스팅 포인트</span>
            <select value={selectedRoast} onChange={(event) => onSelectedRoastChange(event.target.value)} className="min-h-11 w-full rounded-xl border border-white/10 bg-black/20 px-3 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary-amber">
              <option value="">전체 로스팅</option>
              <option value="light">Light (약배전)</option>
              <option value="medium">Medium (중배전)</option>
              <option value="dark">Dark (강배전)</option>
            </select>
          </label>
          <label className="space-y-1.5 text-xs font-bold text-muted-foreground">
            <span>정렬 기준</span>
            <select value={sortBy} onChange={(event) => onSortByChange(event.target.value)} className="min-h-11 w-full rounded-xl border border-white/10 bg-black/20 px-3 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary-amber">
              <option value="newest">최신 등록순</option>
              <option value="repurchase">재구매 우선순</option>
              <option value="acidity_desc">산미 높은순</option>
              <option value="sweetness_desc">단맛 높은순</option>
              <option value="body_desc">바디감 높은순</option>
              <option value="title_asc">이름 가나다순</option>
            </select>
          </label>
          <div className="space-y-2 text-xs font-bold text-muted-foreground">
            <span>최소 맛 스펙트럼</span>
            {[
              { id: "acidity", label: "산미", value: minAcidity, change: onMinAcidityChange },
              { id: "sweetness", label: "단맛", value: minSweetness, change: onMinSweetnessChange },
              { id: "body", label: "바디", value: minBody, change: onMinBodyChange },
            ].map((metric) => (
              <label key={metric.id} htmlFor={`dashboard-${metric.id}`} className="grid grid-cols-[3rem_1fr_2rem] items-center gap-2 font-medium">
                <span>{metric.label}</span>
                <input id={`dashboard-${metric.id}`} type="range" min="1" max="5" value={metric.value} onChange={(event) => metric.change(Number(event.target.value))} className="h-1 w-full cursor-pointer accent-primary-amber" />
                <span>{metric.value}+</span>
              </label>
            ))}
          </div>
        </div>
      </details>
    </section>
  );
}
