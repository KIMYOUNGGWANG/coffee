"use client";

import { AlertTriangle, CheckCircle2, Coffee, Save, SlidersHorizontal, Thermometer } from "lucide-react";
import { useState } from "react";
import type { DialInCoachData, DialInCoachFeedback } from "@/hooks/useTastingCards";

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

const feedbackOptions: readonly {
  readonly value: DialInCoachFeedback;
  readonly label: string;
  readonly simpleNote: string;
  readonly rating: number;
}[] = [
  { value: "too_sour", label: "시다", simpleNote: "최근 컵이 시거나 날카로웠어요.", rating: 2 },
  { value: "too_bitter", label: "쓰다", simpleNote: "최근 컵이 쓰거나 텁텁했어요.", rating: 2 },
  { value: "too_weak", label: "묽다", simpleNote: "최근 컵이 묽고 비어 있었어요.", rating: 2 },
  { value: "too_heavy", label: "무겁다", simpleNote: "최근 컵이 무겁고 답답했어요.", rating: 2 },
  { value: "balanced", label: "좋았다", simpleNote: "최근 컵이 좋아서 같은 레시피를 반복하고 싶어요.", rating: 5 },
];

async function saveFeedbackLog(data: DialInCoachData, feedback: (typeof feedbackOptions)[number]) {
  const response = await fetch("/api/v1/brewing-logs", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      shelfItemId: data.suggestedLog.shelfItemId,
      method: data.suggestedLog.method,
      parameters: data.suggestedLog.parameters,
      rating: feedback.rating,
      simpleNote: feedback.simpleNote,
      coachSource: "dial_in_coach",
      coachFeedback: feedback.value,
      coachIteration: 1,
      coachSnapshot: {
        ...data.suggestedLog.coachSnapshot,
        feedback: feedback.value,
      },
    }),
  });

  if (!response.ok) {
    throw new Error("컵 피드백 저장에 실패했습니다.");
  }
}

export function DashboardDialInCoachPanel({
  data,
  isLoading,
  error,
  onSaved,
}: DashboardDialInCoachPanelProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [savingFeedback, setSavingFeedback] = useState<DialInCoachFeedback | null>(null);
  const [savedMessage, setSavedMessage] = useState<string | null>(null);

  if (isLoading) {
    return (
      <section className="espresso-panel p-5" aria-label="Dial-in Coach">
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
      <section className="espresso-panel p-5" aria-label="Dial-in Coach">
        <div className="flex gap-3">
          <AlertTriangle className="mt-1 text-primary-amber" size={18} />
          <div>
            <h2 className="font-serif text-xl font-black">오늘의 시작 레시피를 불러오지 못했어요</h2>
            <p className="mt-1 text-sm font-semibold leading-6 text-[#FFF8EC]/58">
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
      setSavedMessage("오늘의 시작 레시피와 선반 잔량을 함께 저장했어요.");
      onSaved();
    } catch (saveError) {
      setSavedMessage(saveError instanceof Error ? saveError.message : "저장에 실패했습니다.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleFeedbackSave = async (feedback: (typeof feedbackOptions)[number]) => {
    try {
      setSavingFeedback(feedback.value);
      setSavedMessage(null);
      await saveFeedbackLog(data, feedback);
      setSavedMessage(`${feedback.label} 피드백과 선반 잔량을 저장했어요. 다음 추천은 이 조정값을 반영합니다.`);
      onSaved();
    } catch (saveError) {
      setSavedMessage(saveError instanceof Error ? saveError.message : "저장에 실패했습니다.");
    } finally {
      setSavingFeedback(null);
    }
  };

  return (
    <section className="espresso-panel p-4 sm:p-5" aria-label="Dial-in Coach">
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
        <div>
          <span className="coffee-kicker">
            <SlidersHorizontal size={12} />
            Dial-in Coach
          </span>
          <h2 className="mt-3 break-keep font-serif text-2xl font-black leading-tight sm:text-3xl">
            오늘 첫 컵을 어디서 시작할지 정해드릴게요
          </h2>
          <p className="mt-2 max-w-2xl break-keep text-sm font-semibold leading-6 text-[#FFF8EC]/62">
            {data.problem}
          </p>
          <p className="mt-2 break-keep text-xs font-bold leading-5 text-primary-amber/82">
            이 레시피로 기록하면 사용한 원두 무게만큼 선반 잔량도 자동으로 줄어듭니다.
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
        <div className="coffee-metric-card">
          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-primary-amber/80">Selected Bean</p>
          <p className="mt-3 break-keep text-lg font-black leading-6">{data.title}</p>
          <p className="mt-1 truncate text-xs font-semibold text-[#FFF8EC]/45">{data.subtitle}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {data.evidence.map((item) => (
              <span key={item} className="rounded-full border border-white/12 bg-white/[0.04] px-3 py-1 text-xs font-bold text-[#FFF8EC]/62">
                {item}
              </span>
            ))}
          </div>
        </div>

        <div className="coffee-metric-card">
          <p className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.16em] text-primary-amber/80">
            <Coffee size={13} />
            Starting Recipe
          </p>
          <div className="mt-4 grid grid-cols-2 gap-2 text-sm font-bold text-[#FFF8EC]/72">
            <span>원두 {data.recipe.coffeeAmount}g</span>
            <span>물 {data.recipe.waterAmount}g</span>
            <span className="inline-flex items-center gap-1"><Thermometer size={13} />{data.recipe.waterTemp}C</span>
            <span>{data.recipe.ratioLabel}</span>
            <span>{data.recipe.grindSize}</span>
            <span>{data.recipe.brewTime}</span>
          </div>
          <p className="mt-4 text-sm font-black text-primary-amber">{data.recipe.method}</p>
        </div>

        <div className="coffee-metric-card">
          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-primary-amber/80">Next Moves</p>
          <div className="mt-3 space-y-3">
            {data.adjustments.slice(0, 3).map((adjustment) => (
              <div key={adjustment.trigger}>
                <p className="text-sm font-black text-[#FFF8EC]">{adjustment.label}</p>
                <p className="mt-1 break-keep text-xs font-semibold leading-5 text-[#FFF8EC]/58">{adjustment.nextMove}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-4 rounded-[1.35rem] border border-white/12 bg-white/[0.045] p-4">
        <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-primary-amber/80">Brew Failure Memory</p>
            <h3 className="mt-1 break-keep text-base font-black text-[#FFF8EC]">방금 컵은 어땠나요?</h3>
            <p className="mt-1 break-keep text-xs font-semibold leading-5 text-[#FFF8EC]/58">
              하나만 눌러두면 다음 추천에서 분쇄도, 물 온도, 비율, 시간을 한 변수씩 보정합니다.
            </p>
          </div>
          <div className="grid grid-cols-5 gap-1.5 sm:min-w-[21rem]">
            {feedbackOptions.map((feedback) => (
              <button
                key={feedback.value}
                type="button"
                onClick={() => handleFeedbackSave(feedback)}
                disabled={savingFeedback !== null}
                className="min-h-10 rounded-full border border-white/12 bg-white/[0.055] px-2 text-[11px] font-black text-[#FFF8EC]/72 transition hover:-translate-y-0.5 hover:border-primary-amber/60 hover:bg-primary-amber/12 hover:text-primary-amber disabled:cursor-not-allowed disabled:opacity-55"
              >
                {savingFeedback === feedback.value ? "저장 중" : feedback.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {savedMessage && (
        <p className="mt-4 inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/[0.04] px-3 py-2 text-xs font-bold text-[#FFF8EC]/70">
          <CheckCircle2 size={14} className="text-primary-amber" />
          {savedMessage}
        </p>
      )}
    </section>
  );
}
