"use client";

import { Search, SlidersHorizontal } from "lucide-react";

type DashboardFiltersPanelProps = {
  readonly searchQuery: string;
  readonly selectedMethod: string;
  readonly selectedRoast: string;
  readonly minAcidity: number;
  readonly minSweetness: number;
  readonly minBody: number;
  readonly sortBy: string;
  readonly onSearchQueryChange: (value: string) => void;
  readonly onSelectedMethodChange: (value: string) => void;
  readonly onSelectedRoastChange: (value: string) => void;
  readonly onMinAcidityChange: (value: number) => void;
  readonly onMinSweetnessChange: (value: number) => void;
  readonly onMinBodyChange: (value: number) => void;
  readonly onSortByChange: (value: string) => void;
  readonly onReset: () => void;
};

const availableMethods = ["Hario V60", "Kalita Wave", "Espresso", "AeroPress", "Origami Dripper", "French Press", "Cold Brew"] as const;

export default function DashboardFiltersPanel({
  searchQuery,
  selectedMethod,
  selectedRoast,
  minAcidity,
  minSweetness,
  minBody,
  sortBy,
  onSearchQueryChange,
  onSelectedMethodChange,
  onSelectedRoastChange,
  onMinAcidityChange,
  onMinSweetnessChange,
  onMinBodyChange,
  onSortByChange,
  onReset,
}: DashboardFiltersPanelProps) {
  const hasFilter = Boolean(
    searchQuery ||
    selectedMethod ||
    selectedRoast ||
    minAcidity > 1 ||
    minSweetness > 1 ||
    minBody > 1 ||
    sortBy !== "newest"
  );

  return (
    <div className="bg-white border border-warm-gray rounded-3xl p-5 shadow-sm space-y-4">
      <div className="flex items-center gap-2 pb-2 border-b border-warm-gray">
        <SlidersHorizontal size={14} className="text-caramel" />
        <h3 className="font-serif font-bold text-sm">테이스팅 필터</h3>
      </div>

      <div className="relative">
        <input
          type="text"
          placeholder="원두명, 로스터리, 향미 검색..."
          value={searchQuery}
          onChange={(event) => onSearchQueryChange(event.target.value)}
          className="w-full pl-9 pr-3 py-2 border border-warm-gray rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-caramel bg-white"
        />
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-espresso/45" />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-[10px] font-bold text-espresso/50 uppercase tracking-wider">추출 도구</label>
        <select
          value={selectedMethod}
          onChange={(event) => onSelectedMethodChange(event.target.value)}
          className="w-full px-3 py-2 border border-warm-gray rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-caramel bg-white"
        >
          <option value="">전체 도구</option>
          {availableMethods.map((method) => (
            <option key={method} value={method}>{method}</option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-[10px] font-bold text-espresso/50 uppercase tracking-wider">로스팅 포인트</label>
        <select
          value={selectedRoast}
          onChange={(event) => onSelectedRoastChange(event.target.value)}
          className="w-full px-3 py-2 border border-warm-gray rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-caramel bg-white"
        >
          <option value="">전체 로스팅</option>
          <option value="light">Light (약배전)</option>
          <option value="medium">Medium (중배전)</option>
          <option value="dark">Dark (강배전)</option>
        </select>
      </div>

      {/* Taste profile sliders */}
      <div className="space-y-3 pt-2 border-t border-warm-gray">
        <label className="text-[10px] font-bold text-espresso/50 uppercase tracking-wider block">최소 맛 스펙트럼</label>
        
        <div className="flex flex-col gap-1">
          <div className="flex justify-between text-[11px] font-semibold">
            <span className="text-espresso/70">산미 (Acidity)</span>
            <span>{minAcidity} 이상</span>
          </div>
          <input
            type="range"
            min="1"
            max="5"
            value={minAcidity}
            onChange={(e) => onMinAcidityChange(parseInt(e.target.value) || 1)}
            className="w-full accent-caramel h-1 bg-warm-gray rounded-lg appearance-none cursor-pointer"
          />
        </div>

        <div className="flex flex-col gap-1">
          <div className="flex justify-between text-[11px] font-semibold">
            <span className="text-espresso/70">단맛 (Sweetness)</span>
            <span>{minSweetness} 이상</span>
          </div>
          <input
            type="range"
            min="1"
            max="5"
            value={minSweetness}
            onChange={(e) => onMinSweetnessChange(parseInt(e.target.value) || 1)}
            className="w-full accent-caramel h-1 bg-warm-gray rounded-lg appearance-none cursor-pointer"
          />
        </div>

        <div className="flex flex-col gap-1">
          <div className="flex justify-between text-[11px] font-semibold">
            <span className="text-espresso/70">바디감 (Body)</span>
            <span>{minBody} 이상</span>
          </div>
          <input
            type="range"
            min="1"
            max="5"
            value={minBody}
            onChange={(e) => onMinBodyChange(parseInt(e.target.value) || 1)}
            className="w-full accent-caramel h-1 bg-warm-gray rounded-lg appearance-none cursor-pointer"
          />
        </div>
      </div>

      {/* Sort selection dropdown */}
      <div className="flex flex-col gap-1.5 pt-2 border-t border-warm-gray">
        <label className="text-[10px] font-bold text-espresso/50 uppercase tracking-wider">정렬 기준</label>
        <select
          value={sortBy}
          onChange={(event) => onSortByChange(event.target.value)}
          className="w-full px-3 py-2 border border-warm-gray rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-caramel bg-white"
        >
          <option value="newest">최신 등록순</option>
          <option value="acidity_desc">산미 높은순</option>
          <option value="sweetness_desc">단맛 높은순</option>
          <option value="body_desc">바디감 높은순</option>
          <option value="title_asc">이름 가나다순</option>
        </select>
      </div>

      {hasFilter && (
        <button
          type="button"
          onClick={onReset}
          className="text-[10px] font-bold text-caramel hover:underline w-full text-center"
        >
          필터 초기화
        </button>
      )}
    </div>
  );
}
