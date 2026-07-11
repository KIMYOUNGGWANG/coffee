"use client";

import { Bell, CalendarPlus, CheckCircle2, Pin, RotateCcw } from "lucide-react";
import type { ShelfItem } from "@/components/shelf/CoffeePackageItem";
import { useAnalyticsEvents } from "@/hooks/use-analytics-events";
import { cn } from "@/lib/utils";

type ShelfRebuyReminderControlsProps = {
  readonly item: ShelfItem;
  readonly isPinnedForRebuy: boolean;
  readonly onUpdateReminderState: (
    id: string,
    update: {
      rebuyPriority?: ShelfItem["rebuy_priority"];
      rebuyReminderDate?: string | null;
      rebuyAction?: ShelfItem["rebuy_action"];
    },
  ) => void;
};

export function ShelfRebuyReminderControls({
  item,
  isPinnedForRebuy,
  onUpdateReminderState,
}: ShelfRebuyReminderControlsProps) {
  const { trackEvent } = useAnalyticsEvents();

  return (
    <div data-testid="shelf-rebuy-reminder-controls" className="space-y-2 rounded-md border border-[#D4AF37]/15 bg-[#D4AF37]/5 p-3 text-[10px]">
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 font-bold text-[#D4AF37]">
            <Bell size={12} />
            앱 내부 리마인더
          </div>
          <p className="mt-1 truncate text-white/50">
            {item.rebuy_reminder_date ? `${item.rebuy_reminder_date}에 다시 보기` : "다음 구매 타이밍을 저장하세요."}
          </p>
        </div>
        <button
          type="button"
          onClick={() => onUpdateReminderState(item.id, { rebuyPriority: isPinnedForRebuy ? "normal" : "pinned" })}
          className={cn(
            "flex min-h-[44px] shrink-0 items-center gap-1.5 rounded-md border px-3 py-2 font-bold transition-colors cursor-pointer",
            isPinnedForRebuy
              ? "border-[#D4AF37]/50 bg-[#D4AF37]/20 text-[#D4AF37]"
              : "border-white/10 bg-white/5 text-white/60 hover:text-white",
          )}
        >
          <Pin size={12} />
          {isPinnedForRebuy ? "고정됨" : "고정"}
        </button>
      </div>
      <input
        type="date"
        value={item.rebuy_reminder_date ?? ""}
        onChange={(event) => onUpdateReminderState(item.id, { rebuyReminderDate: event.target.value || null })}
        className="min-h-[44px] w-full rounded-md border border-white/10 bg-black/30 px-3 py-2 text-[11px] text-white outline-none focus:border-[#D4AF37]/50"
        aria-label="재구매 예정일"
      />
      {item.rebuy_reminder_date && (
        <a
          href={`/api/v1/shelf/${encodeURIComponent(item.id)}/rebuy-calendar`}
          onClick={(event) => {
            event.stopPropagation();
            trackEvent("rebuy_calendar_export_clicked", { source: "shelf_reminder" });
          }}
          className="flex min-h-[44px] items-center justify-center gap-1.5 rounded-md border border-[#D4AF37]/25 bg-[#D4AF37]/10 px-3 py-2 font-bold text-[#D4AF37] transition-colors hover:bg-[#D4AF37]/18"
        >
          <CalendarPlus size={12} aria-hidden="true" />
          캘린더에 저장
        </a>
      )}
      <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.35fr)_minmax(0,1fr)] gap-1.5">
        <button
          type="button"
          onClick={() => onUpdateReminderState(item.id, { rebuyAction: "drank" })}
          className={cn(
            "flex min-h-[44px] items-center justify-center gap-1 whitespace-nowrap rounded-md border px-2 py-2 transition-colors cursor-pointer",
            item.rebuy_action === "drank" ? "border-white/30 bg-white/15 text-white" : "border-white/10 bg-white/5 text-white/55 hover:text-white",
          )}
        >
          <CheckCircle2 size={12} />
          마셨음
        </button>
        <button
          type="button"
          onClick={() => onUpdateReminderState(item.id, { rebuyAction: "will_rebuy", rebuyPriority: "pinned" })}
          className={cn(
            "flex min-h-[44px] items-center justify-center gap-1 whitespace-nowrap rounded-md border px-2 py-2 transition-colors cursor-pointer",
            item.rebuy_action === "will_rebuy" ? "border-[#D4AF37]/50 bg-[#D4AF37]/20 text-[#D4AF37]" : "border-[#D4AF37]/20 bg-[#D4AF37]/5 text-[#D4AF37]/75 hover:text-[#D4AF37]",
          )}
        >
          <Bell size={12} />
          다시 살래요
        </button>
        <button
          type="button"
          onClick={() => onUpdateReminderState(item.id, { rebuyAction: "rebought", rebuyPriority: "normal", rebuyReminderDate: null })}
          className={cn(
            "flex min-h-[44px] items-center justify-center gap-1 whitespace-nowrap rounded-md border px-2 py-2 transition-colors cursor-pointer",
            item.rebuy_action === "rebought" ? "border-[#4d7c54]/50 bg-[#4d7c54]/20 text-[#9fca9a]" : "border-white/10 bg-white/5 text-white/55 hover:text-white",
          )}
        >
          <RotateCcw size={12} />
          완료
        </button>
      </div>
    </div>
  );
}
