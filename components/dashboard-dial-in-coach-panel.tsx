"use client";

import { AlertTriangle, CheckCircle2, Coffee, Save, SlidersHorizontal, Thermometer } from "lucide-react";
import { useState } from "react";
import type { DialInCoachData } from "@/hooks/useTastingCards";

type DashboardDialInCoachPanelProps = {
  readonly data: DialInCoachData | undefined;
  readonly isLoading: boolean;
  readonly error: unknown;
  readonly onSaved: () => void;
};

async function saveSuggestedLog(data: DialInCoachData) {
  const response = await fetch("/api/v1/brewing-logs", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      shelfItemId: data.suggestedLog.shelfItemId,
      method: data.suggestedLog.method,
      parameters: data.suggestedLog.parameters,
      rating: null,
      simpleNote: data.suggestedLog.simpleNote,
      coachSource: "dial_in_coach",
      coachIteration: 1,
      coachSnapshot: data.suggestedLog.coachSnapshot,
    }),
  });

  if (!response.ok) {
    throw new Error("다이얼인 로그 저장에 실패했습니다.");
  }
}

export function DashboardDialInCoachPanel({
  data,
  isLoading,
  error,
  onSaved,
}: DashboardDialInCoachPanelProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [savedMessage, setSavedMessage] = useState<string | null>(null);

  if (isLoading) {
    return (
      <section className="rounded-[1.75rem] border border-white/10 bg-[#120d09] p-5 text-[#F7F7F4]" aria-label="Dial-in Coach">
        <div className="h-4 w-32 animate-pulse rounded-full bg-white/10" />
        <div className="mt-5 grid gap-3 lg:grid-cols-3">
          <div className="h-40 animate-pulse rounded-2xl bg-white/[0.055]" />
          <div className="h-40 animate-pulse rounded-2xl bg-white/[0.055]" />
          <div className="h-40 animate-pulse rounded-2xl bg-white/[0.055]" />
        </div>
      </section>
    );
  }

  if (error || !data) {
    return (
      <section className="rounded-[1.75rem] border border-white/10 bg-[#120d09] p-5 text-[#F7F7F4]" aria-label="Dial-in Coach">
        <div className="flex gap-3">
          <AlertTriangle className="mt-1 text-primary-amber" size={18} />
          <div>
            <h2 className="font-serif text-xl font-black">오늘의 시작 레시피를 불러오지 못했어요</h2>
            <p className="mt-1 text-sm font-semibold leading-6 text-[#F7F7F4]/58">
              추출 캘린더는 그대로 사용할 수 있어요. 잠시 후 다시 열면 원두별 시작점을 계산합니다.
            </p>
          </div>
        </div>
      </section>
    );
  }

  const handleSave = async () => {
    try {
      setIsSaving(true);
      setSavedMessage(null);
      await saveSuggestedLog(data);
      setSavedMessage("오늘의 시작 레시피를 추출 로그에 저장했어요.");
      onSaved();
    } catch (saveError) {
      setSavedMessage(saveError instanceof Error ? saveError.message : "저장에 실패했습니다.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <section className="rounded-[1.75rem] border border-primary-amber/20 bg-[#120d09] p-4 text-[#F7F7F4] shadow-[0_24px_80px_rgba(0,0,0,0.28)] sm:p-5" aria-label="Dial-in Coach">
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-primary-amber/28 bg-primary-amber/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-primary-amber">
            <SlidersHorizontal size={12} />
            Dial-in Coach
          </span>
          <h2 className="mt-3 break-keep font-serif text-2xl font-black leading-tight sm:text-3xl">
            오늘 첫 컵을 어디서 시작할지 정해드릴게요
          </h2>
          <p className="mt-2 max-w-2xl break-keep text-sm font-semibold leading-6 text-[#F7F7F4]/62">
            {data.problem}
          </p>
        </div>
        <button
          type="button"
          onClick={handleSave}
          disabled={isSaving}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-primary-amber bg-primary-amber px-4 text-sm font-black text-background-dark transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Save size={16} />
          {isSaving ? "저장 중" : "이 레시피로 로그 시작"}
        </button>
      </div>

      <div className="mt-5 grid gap-3 lg:grid-cols-[1.1fr_0.9fr_1fr]">
        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-primary-amber/80">Selected Bean</p>
          <p className="mt-3 break-keep text-lg font-black leading-6">{data.title}</p>
          <p className="mt-1 truncate text-xs font-semibold text-[#F7F7F4]/45">{data.subtitle}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {data.evidence.map((item) => (
              <span key={item} className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs font-bold text-[#F7F7F4]/62">
                {item}
              </span>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
          <p className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.16em] text-primary-amber/80">
            <Coffee size={13} />
            Starting Recipe
          </p>
          <div className="mt-4 grid grid-cols-2 gap-2 text-sm font-bold text-[#F7F7F4]/72">
            <span>원두 {data.recipe.coffeeAmount}g</span>
            <span>물 {data.recipe.waterAmount}g</span>
            <span className="inline-flex items-center gap-1"><Thermometer size={13} />{data.recipe.waterTemp}C</span>
            <span>{data.recipe.ratioLabel}</span>
            <span>{data.recipe.grindSize}</span>
            <span>{data.recipe.brewTime}</span>
          </div>
          <p className="mt-4 text-sm font-black text-primary-amber">{data.recipe.method}</p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-primary-amber/80">Next Moves</p>
          <div className="mt-3 space-y-3">
            {data.adjustments.slice(0, 3).map((adjustment) => (
              <div key={adjustment.trigger}>
                <p className="text-sm font-black text-[#F7F7F4]">{adjustment.label}</p>
                <p className="mt-1 break-keep text-xs font-semibold leading-5 text-[#F7F7F4]/58">{adjustment.nextMove}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {savedMessage && (
        <p className="mt-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-bold text-[#F7F7F4]/70">
          <CheckCircle2 size={14} className="text-primary-amber" />
          {savedMessage}
        </p>
      )}
    </section>
  );
}
