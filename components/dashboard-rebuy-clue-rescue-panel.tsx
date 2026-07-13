"use client";

import { useState } from "react";
import { AlertCircle, BookOpenText, Check, Loader2, PencilLine, X } from "lucide-react";
import { useUpdateTastingCard, type TastingCardData } from "@/hooks/useTastingCards";
import {
  buildRebuyClueRescue,
  buildRebuyClueRescuePatch,
  hasRebuyClueRescueProgress,
  type RebuyClueRescueCandidate,
  type RebuyClueRescueForm,
} from "@/lib/rebuy-clue-rescue";

type DashboardRebuyClueRescuePanelProps = {
  readonly cards: readonly TastingCardData[];
  readonly onQuickAdd: () => void;
  readonly onSelectCard: (card: TastingCardData) => void;
};

function priorityClassName(candidate: RebuyClueRescueCandidate): string {
  switch (candidate.priority) {
    case "high":
      return "border-[#B45309]/25 bg-[#B45309]/12 text-[#5A2B0B]";
    case "medium":
      return "border-primary-amber/25 bg-primary-amber/12 text-background-dark";
    case "low":
      return "border-emerald-700/15 bg-emerald-700/8 text-emerald-950";
  }
}

function findCard(cards: readonly TastingCardData[], candidate: RebuyClueRescueCandidate): TastingCardData | null {
  return cards.find((card) => card.id === candidate.cardId) ?? null;
}

function buildInitialFormState(card: TastingCardData): RebuyClueRescueForm {
  return {
    purchaseNote: card.purchase_note ?? "",
    purchaseUrl: card.purchase_url ?? "",
    rebuyReason: card.repurchase_reasons.find((reason) => reason.trim().length > 0) ?? "",
  };
}

export function DashboardRebuyClueRescuePanel({
  cards,
  onQuickAdd,
  onSelectCard,
}: DashboardRebuyClueRescuePanelProps) {
  const rescue = buildRebuyClueRescue(cards);
  const updateCardMutation = useUpdateTastingCard();
  const [editingCardId, setEditingCardId] = useState<string | null>(null);
  const [savedCardId, setSavedCardId] = useState<string | null>(null);
  const [form, setForm] = useState<RebuyClueRescueForm>({ purchaseNote: "", purchaseUrl: "", rebuyReason: "" });
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (cards.length === 0 || rescue.candidates.length === 0) return null;

  function startEditing(card: TastingCardData | null) {
    if (!card) {
      onQuickAdd();
      return;
    }

    setEditingCardId(card.id);
    setSavedCardId(null);
    setErrorMessage(null);
    setForm(buildInitialFormState(card));
  }

  async function saveClues(card: TastingCardData) {
    setErrorMessage(null);
    if (!hasRebuyClueRescueProgress(card, form)) {
      setErrorMessage("빠진 단서를 하나 이상 채운 뒤 저장하세요.");
      return;
    }

    try {
      await updateCardMutation.mutateAsync({
        id: card.id,
        fields: buildRebuyClueRescuePatch(card, form),
      });
      setSavedCardId(card.id);
      setEditingCardId(null);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "재구매 단서를 저장하지 못했습니다.");
    }
  }

  return (
    <section className="premium-shell mb-5" aria-label="재구매 단서 보강">
      <div className="premium-card p-4 sm:p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <span className="coffee-kicker">
              <AlertCircle size={12} />
              단서 보강 큐
            </span>
            <h2 className="mt-3 break-keep font-serif text-2xl font-black leading-tight text-background-dark">
              다시 사고 싶은데 나중에 못 찾을 기록을 먼저 보강하세요
            </h2>
            <p className="mt-2 max-w-2xl break-keep text-sm font-bold leading-6 text-muted-foreground">
              {rescue.summary} 구매처, 가격, 구매 링크, 다시 살 이유를 기준으로 봅니다.
            </p>
          </div>
          <div className="rounded-2xl border border-background-dark/10 bg-[#fffaf2] px-4 py-3">
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-primary-amber">
              Memory Rescue
            </p>
            <p className="mt-1 text-sm font-black text-background-dark">
              {rescue.totalCandidates}개 보강 필요
            </p>
          </div>
        </div>

        <div className="mt-5 grid gap-3 lg:grid-cols-3">
          {rescue.candidates.map((candidate) => {
            const card = findCard(cards, candidate);
            const isEditing = editingCardId === candidate.cardId;
            const isSaving = updateCardMutation.isPending && updateCardMutation.variables?.id === candidate.cardId;
            const isSaved = savedCardId === candidate.cardId;
            const canSaveClues = card ? hasRebuyClueRescueProgress(card, form) : false;
            const saveHelpId = `rescue-save-help-${candidate.cardId}`;
            return (
              <article
                key={candidate.cardId}
                className="flex min-h-[250px] flex-col rounded-2xl border border-background-dark/10 bg-white p-4 shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <span className={`inline-flex min-h-7 items-center rounded-full border px-2.5 text-[11px] font-black ${priorityClassName(candidate)}`}>
                    {candidate.priority === "high" ? "먼저 보강" : candidate.priority === "medium" ? "보강 추천" : "가볍게 확인"}
                  </span>
                  <span className="shrink-0 text-xs font-black text-muted-foreground">
                    {candidate.daysSince}일 전
                  </span>
                </div>
                <p className="mt-4 break-keep text-lg font-black leading-6 text-background-dark">
                  {candidate.title}
                </p>
                <p className="mt-1 truncate text-xs font-black uppercase tracking-[0.12em] text-primary-amber">
                  {candidate.subtitle || "CoffeeDex"}
                </p>
                <div className="mt-4 rounded-2xl border border-primary-amber/20 bg-[#fff8ec] p-3">
                  <p className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.16em] text-primary-amber">
                    <BookOpenText size={12} />
                    지금 남은 단서
                  </p>
                  <p className="mt-1 line-clamp-2 break-keep text-xs font-bold leading-5 text-background-dark">
                    {candidate.savedClue}
                  </p>
                </div>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {candidate.missingLabels.map((label) => (
                    <span key={label} className="rounded-full border border-background-dark/10 bg-[#fffaf2] px-2 py-1 text-[10px] font-black text-background-dark/75">
                      {label} 없음
                    </span>
                  ))}
                </div>
                <p className="mt-3 break-keep text-sm font-bold leading-6 text-muted-foreground">
                  {candidate.rescuePrompt}
                </p>
                {isEditing && card ? (
                  <form
                    className="mt-4 space-y-3 rounded-2xl border border-primary-amber/20 bg-[#fffaf2] p-3"
                    onSubmit={(event) => {
                      event.preventDefault();
                      void saveClues(card);
                    }}
                  >
                    <div className="grid gap-2">
                      <label className="text-[11px] font-black text-background-dark" htmlFor={`rescue-note-${card.id}`}>
                        구매처 · 가격 메모
                      </label>
                      <input
                        id={`rescue-note-${card.id}`}
                        maxLength={160}
                        value={form.purchaseNote}
                        onChange={(event) => setForm((current) => ({ ...current, purchaseNote: event.target.value }))}
                        placeholder="예: 프릳츠 공식몰 200g 18,000원"
                        className="min-h-10 rounded-xl border border-background-dark/10 bg-white px-3 text-sm font-bold text-background-dark outline-none focus:border-primary-amber focus:ring-2 focus:ring-primary-amber/20"
                      />
                    </div>
                    <div className="grid gap-2">
                      <label className="text-[11px] font-black text-background-dark" htmlFor={`rescue-url-${card.id}`}>
                        구매 링크
                      </label>
                      <input
                        id={`rescue-url-${card.id}`}
                        type="url"
                        maxLength={500}
                        value={form.purchaseUrl}
                        onChange={(event) => setForm((current) => ({ ...current, purchaseUrl: event.target.value }))}
                        placeholder="https://..."
                        className="min-h-10 rounded-xl border border-background-dark/10 bg-white px-3 text-sm font-bold text-background-dark outline-none focus:border-primary-amber focus:ring-2 focus:ring-primary-amber/20"
                      />
                    </div>
                    <div className="grid gap-2">
                      <label className="text-[11px] font-black text-background-dark" htmlFor={`rescue-reason-${card.id}`}>
                        다시 살 이유
                      </label>
                      <input
                        id={`rescue-reason-${card.id}`}
                        maxLength={80}
                        value={form.rebuyReason}
                        onChange={(event) => setForm((current) => ({ ...current, rebuyReason: event.target.value }))}
                        placeholder="예: 식어도 복숭아 단맛이 선명했음"
                        className="min-h-10 rounded-xl border border-background-dark/10 bg-white px-3 text-sm font-bold text-background-dark outline-none focus:border-primary-amber focus:ring-2 focus:ring-primary-amber/20"
                      />
                    </div>
                    {!canSaveClues && (
                      <p id={saveHelpId} className="text-[11px] font-bold leading-5 text-muted-foreground" aria-live="polite">
                        빠진 단서를 하나 이상 채운 뒤 저장하세요.
                      </p>
                    )}
                    {errorMessage && (
                      <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-[11px] font-bold leading-5 text-red-700">
                        {errorMessage}
                      </p>
                    )}
                    <div className="grid gap-2 sm:grid-cols-2">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingCardId(null);
                          setErrorMessage(null);
                        }}
                        className="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-full border border-[#8C5E35]/20 px-3 text-xs font-black text-background-dark transition hover:-translate-y-0.5"
                      >
                        <X size={13} />
                        닫기
                      </button>
                      <button
                        type="submit"
                        disabled={isSaving || !canSaveClues}
                        aria-describedby={!canSaveClues ? saveHelpId : undefined}
                        className="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-full bg-background-dark px-3 text-xs font-black text-[#fff8ec] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-70"
                      >
                        {isSaving ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
                        {isSaving ? "저장 중" : "단서 저장"}
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="mt-auto grid gap-2 pt-4 sm:grid-cols-2">
                    <button
                      type="button"
                      onClick={() => (card ? onSelectCard(card) : onQuickAdd())}
                      className="inline-flex min-h-10 items-center justify-center rounded-full border border-[#8C5E35]/20 px-3 text-xs font-black text-background-dark transition hover:-translate-y-0.5"
                    >
                      카드 열기
                    </button>
                    <button
                      type="button"
                      onClick={() => startEditing(card)}
                      className="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-full bg-background-dark px-3 text-xs font-black text-[#fff8ec] transition hover:-translate-y-0.5"
                    >
                      {isSaved ? <Check size={13} /> : <PencilLine size={13} />}
                      {isSaved ? "보강 저장됨" : "여기서 보강"}
                    </button>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
