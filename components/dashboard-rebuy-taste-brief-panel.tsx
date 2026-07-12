"use client";

import { useState } from "react";
import { Check, Copy, MessageCircle, PencilLine, Sparkles } from "lucide-react";
import { useAnalyticsEvents } from "@/hooks/use-analytics-events";
import type { TastingCardData } from "@/hooks/useTastingCards";
import { buildRebuyTasteBrief } from "@/lib/rebuy-taste-brief";

type DashboardRebuyTasteBriefPanelProps = {
  readonly cards: readonly TastingCardData[];
  readonly personalTasteLine: string | null;
  readonly isSaving: boolean;
  readonly onSavePersonalTasteLine: (line: string | null) => Promise<void>;
};

export function DashboardRebuyTasteBriefPanel({
  cards,
  personalTasteLine,
  isSaving,
  onSavePersonalTasteLine,
}: DashboardRebuyTasteBriefPanelProps) {
  const brief = buildRebuyTasteBrief(cards);
  const [isCopied, setIsCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const [saveError, setSaveError] = useState<string | null>(null);
  const { trackEvent } = useAnalyticsEvents();

  if (!brief) return null;

  const savedLine = personalTasteLine?.trim() || null;
  const visibleLine = savedLine ?? brief.preferenceLine;
  const copyText = visibleLine;

  function startEditing() {
    setDraft(visibleLine);
    setSaveError(null);
    setIsEditing(true);
  }

  async function saveLine(line: string | null) {
    try {
      await onSavePersonalTasteLine(line);
      trackEvent("taste_preference_saved", {
        source: "rebuy_taste_brief",
        mode: line ? "custom" : "auto",
      });
      setSaveError(null);
      setIsEditing(false);
    } catch (error: unknown) {
      if (error instanceof Error) {
        setSaveError(error.message);
        return;
      }
      throw error;
    }
  }

  async function copyOrderPhrase() {
    try {
      await navigator.clipboard.writeText(copyText);
      trackEvent("taste_preference_copied", {
        source: "rebuy_taste_brief",
        mode: savedLine ? "custom" : "auto",
      });
      setIsCopied(true);
      window.setTimeout(() => setIsCopied(false), 1800);
    } catch (error: unknown) {
      if (error instanceof Error) {
        window.alert("취향 문장을 복사하지 못했습니다. 문장을 길게 눌러 직접 복사해주세요.");
        return;
      }
      throw error;
    }
  }

  return (
    <section className="premium-shell mb-5" aria-label="재구매 취향 문장">
      <div className="premium-card grid gap-4 p-4 sm:p-5 lg:grid-cols-[0.9fr_1.1fr]">
        <div>
          <span className="coffee-kicker">
            <MessageCircle size={12} />
            취향 주문 문장
          </span>
          <h2 className="mt-3 break-keep font-serif text-2xl font-black leading-tight text-background-dark">
            다음 원두를 고를 내 취향 한 문장
          </h2>
          <p className="mt-2 break-keep text-sm font-bold leading-6 text-muted-foreground">
            많이 모으는 보상이 아니라, 내가 다시 찾는 향과 질감이 선명해지는 보상입니다.
          </p>

          <div className="mt-4 flex flex-wrap gap-2">
            {brief.flavorTags.length > 0 ? (
              brief.flavorTags.map((tag) => (
                <span key={tag} className="rounded-full border border-primary-amber/20 bg-primary-amber/10 px-3 py-1 text-xs font-black text-background-dark">
                  #{tag}
                </span>
              ))
            ) : (
              <span className="rounded-full border border-primary-amber/20 bg-primary-amber/10 px-3 py-1 text-xs font-black text-background-dark">
                다시 살 후보 {brief.totalSourceCards}개
              </span>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-background-dark/10 bg-[#fff8ec] p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <p className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.16em] text-primary-amber">
                <Sparkles size={12} />
                Barista Brief
              </p>
              <p className="mt-2 break-keep text-sm font-black leading-6 text-background-dark">
                {brief.preferenceLine}
              </p>
            </div>
            <div className="flex w-full shrink-0 flex-wrap gap-2 sm:w-auto sm:justify-end">
              <button
                type="button"
                onClick={startEditing}
                className="inline-flex min-h-11 flex-1 items-center justify-center gap-1 rounded-full border border-[#8C5E35]/20 bg-white px-3 text-xs font-black text-background-dark transition hover:-translate-y-0.5 sm:flex-none"
                aria-label="내 말로 고치기"
              >
                <PencilLine size={13} />
                고치기
              </button>
              <button
                type="button"
                onClick={() => void copyOrderPhrase()}
                className="inline-flex min-h-11 flex-1 items-center justify-center gap-1 rounded-full border border-[#8C5E35]/20 bg-white px-3 text-xs font-black text-background-dark transition hover:-translate-y-0.5 sm:flex-none"
                aria-label="내 취향 문장 복사"
              >
                {isCopied ? <Check size={13} /> : <Copy size={13} />}
                {isCopied ? "복사됨" : "복사"}
              </button>
            </div>
          </div>

          {isEditing ? (
            <div className="mt-3 rounded-2xl border border-primary-amber/25 bg-white p-3">
              <label htmlFor="personal-taste-line" className="text-[11px] font-black text-background-dark">
                내 취향 문장
              </label>
              <textarea
                id="personal-taste-line"
                aria-label="내 취향 문장"
                value={draft}
                maxLength={160}
                rows={3}
                onChange={(event) => setDraft(event.target.value)}
                className="mt-2 w-full resize-none rounded-xl border border-background-dark/15 bg-[#fffaf2] px-3 py-3 text-sm font-bold leading-6 text-background-dark transition focus:border-primary-amber focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-amber focus-visible:ring-offset-2"
              />
              <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                <span className="text-[10px] font-bold text-muted-foreground">{draft.length}/160 · 원두 이름보다 내가 느낀 기준으로 적어보세요.</span>
                <div className="flex flex-wrap gap-2">
                  {savedLine && (
                    <button
                      type="button"
                      disabled={isSaving}
                      onClick={() => void saveLine(null)}
                      className="min-h-11 rounded-full border border-background-dark/15 px-3 text-xs font-black text-background-dark disabled:opacity-50"
                    >
                      자동 문장 사용
                    </button>
                  )}
                  <button
                    type="button"
                    disabled={isSaving || draft.trim().length === 0 || draft.trim() === savedLine}
                    onClick={() => void saveLine(draft.trim())}
                    className="min-h-11 rounded-full bg-background-dark px-4 text-xs font-black text-[#fff8ec] disabled:opacity-50"
                  >
                    {isSaving ? "저장 중" : "내 취향으로 저장"}
                  </button>
                </div>
              </div>
              {saveError && <p role="alert" className="mt-2 text-xs font-bold text-red-700">{saveError}</p>}
            </div>
          ) : (
            <div className="mt-3 rounded-2xl border border-background-dark/10 bg-white px-3 py-3">
              <p className="text-[10px] font-black uppercase tracking-[0.14em] text-primary-amber">
                {savedLine ? "내가 저장한 표현" : "기록에서 만든 초안"}
              </p>
              <p className="mt-1 break-keep text-sm font-bold leading-6 text-background-dark">{visibleLine}</p>
            </div>
          )}

          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {brief.sampleCards.map((sample) => (
              <div key={sample} className="rounded-2xl border border-background-dark/10 bg-white/60 px-3 py-2">
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-primary-amber">좋았던 예시</p>
                <p className="mt-1 truncate text-xs font-black text-background-dark">{sample}</p>
              </div>
            ))}
          </div>

          <p className="mt-3 break-keep text-[11px] font-bold leading-5 text-muted-foreground">
            {brief.evidence.join(" · ")}
          </p>
        </div>
      </div>
    </section>
  );
}
