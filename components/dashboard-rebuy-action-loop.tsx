"use client";

import { useEffect, useRef, useState } from "react";
import { PackagePlus } from "lucide-react";
import { useAnalyticsEvents } from "@/hooks/use-analytics-events";
import { useStartRebuyShelfMemory } from "@/hooks/use-rebuy-shelf-memory";
import { useUpdateShelfRebuyState } from "@/hooks/use-shelf-rebuy-state";
import type { ShelfRebuyAction } from "@/hooks/use-shelf-rebuy-state";
import { buildRebuyShelfReplenishPayload } from "@/lib/rebuy-shelf-transfer";
import type { RebuyShelfReplenishSource } from "@/lib/rebuy-shelf-transfer";

type DashboardRebuyActionLoopProps = {
  readonly actionShelfItemId: string | null;
  readonly continuation: RebuyShelfReplenishSource | null;
  readonly title: string;
  readonly onShelfMemoryStarted: () => void;
};

export function DashboardRebuyActionLoop({
  actionShelfItemId,
  continuation,
  title,
  onShelfMemoryStarted,
}: DashboardRebuyActionLoopProps) {
  const { trackEvent } = useAnalyticsEvents();
  const [confirmedRebuySource, setConfirmedRebuySource] = useState<RebuyShelfReplenishSource | null>(null);
  const [hasStartedNewBag, setHasStartedNewBag] = useState(false);
  const continuationButtonRef = useRef<HTMLButtonElement>(null);
  const updateShelfRebuyStateMutation = useUpdateShelfRebuyState();
  const startRebuyShelfMemoryMutation = useStartRebuyShelfMemory();
  const isSavingRebuyAction = actionShelfItemId !== null
    && updateShelfRebuyStateMutation.isPending
    && updateShelfRebuyStateMutation.variables?.shelfItemId === actionShelfItemId;

  const saveRebuyAction = async (shelfItemId: string, rebuyAction: ShelfRebuyAction) => {
    const rebuyPriority = rebuyAction === "will_rebuy" ? "pinned" : "normal";
    const rebuyReminderDate = rebuyAction === "rebought" ? null : undefined;

    try {
      await updateShelfRebuyStateMutation.mutateAsync({ shelfItemId, rebuyAction, rebuyPriority, rebuyReminderDate });
      trackEvent("rebuy_action_saved", { action: rebuyAction, source: "rebuy_intelligence" });
      if (rebuyAction === "rebought" && continuation?.id === shelfItemId) {
        setConfirmedRebuySource(continuation);
        setHasStartedNewBag(false);
      } else if (rebuyAction === "will_rebuy") {
        setConfirmedRebuySource(null);
      }
    } catch (error: unknown) {
      window.alert(error instanceof Error ? error.message : "재구매 상태를 저장하지 못했습니다.");
    }
  };

  const startNewBag = async () => {
    if (!confirmedRebuySource) return;

    try {
      const result = await startRebuyShelfMemoryMutation.mutateAsync(buildRebuyShelfReplenishPayload(confirmedRebuySource));
      if (!result.reused) {
        trackEvent("rebuy_shelf_memory_started", { source: "rebuy_intelligence" });
      }
      setHasStartedNewBag(true);
      onShelfMemoryStarted();
    } catch (error: unknown) {
      window.alert(error instanceof Error ? error.message : "새 원두를 선반에 저장하지 못했습니다.");
    }
  };

  useEffect(() => {
    if (confirmedRebuySource) continuationButtonRef.current?.focus();
  }, [confirmedRebuySource]);

  if (!actionShelfItemId && !confirmedRebuySource) return null;
  let continuationButtonLabel = "새 봉투도 선반에 담기";
  if (startRebuyShelfMemoryMutation.isPending) continuationButtonLabel = "선반에 저장 중";
  if (hasStartedNewBag) continuationButtonLabel = "새 봉투 선반에 저장됨";

  return (
    <div className="mt-4 rounded-2xl border border-primary-amber/20 bg-primary-amber/10 p-4" data-testid="rebuy-action-loop">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#F6C892]">재구매 이어가기</p>
          <p className="mt-1 break-keep text-sm font-black text-[#FFF8EC]" aria-live="polite">
            {confirmedRebuySource
              ? `${confirmedRebuySource.beanName ?? "다시 산 원두"}를 다시 샀어요. 새 봉투도 선반에 담아 다음 재구매 시점을 이어가세요.`
              : `${title} 상태를 바로 저장해 다음 방문의 첫 단서로 남겨요.`}
          </p>
        </div>
        {confirmedRebuySource ? (
          <button
            ref={continuationButtonRef}
            type="button"
            disabled={startRebuyShelfMemoryMutation.isPending || hasStartedNewBag}
            onClick={() => void startNewBag()}
            className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-full border border-primary-amber/30 bg-primary-amber px-4 text-xs font-black text-background-dark transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <PackagePlus aria-hidden="true" size={14} />
            {continuationButtonLabel}
          </button>
        ) : actionShelfItemId ? (
          <div className="grid gap-2 sm:grid-cols-2">
            <button
              type="button"
              disabled={isSavingRebuyAction}
              onClick={() => void saveRebuyAction(actionShelfItemId, "will_rebuy")}
              className="inline-flex min-h-11 items-center justify-center rounded-full border border-primary-amber/30 bg-primary-amber px-4 text-xs font-black text-background-dark transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSavingRebuyAction ? "저장 중" : "다시 살래요"}
            </button>
            <button
              type="button"
              disabled={isSavingRebuyAction}
              onClick={() => void saveRebuyAction(actionShelfItemId, "rebought")}
              className="inline-flex min-h-11 items-center justify-center rounded-full border border-[#FFF8EC]/15 bg-[#FFF8EC]/8 px-4 text-xs font-black text-[#FFF8EC] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSavingRebuyAction ? "저장 중" : "다시 샀음"}
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
