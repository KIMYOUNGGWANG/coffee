"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Check, Clock3, Copy, ExternalLink, RefreshCcw, Search, ShoppingBag } from "lucide-react";
import type { TastingCardData } from "@/hooks/useTastingCards";
import { buildRebuyShelfTransferPayload } from "@/lib/rebuy-shelf-transfer";
import { buildRebuyTimingMemory, type RebuyTimingCandidate } from "@/lib/rebuy-timing-memory";

type DashboardRebuyTimingMemoryPanelProps = {
  readonly cards: readonly TastingCardData[];
  readonly onQuickAdd: () => void;
  readonly onSelectCard: (card: TastingCardData) => void;
};

function findCard(cards: readonly TastingCardData[], candidate: RebuyTimingCandidate): TastingCardData | null {
  return cards.find((card) => card.id === candidate.cardId) ?? null;
}

function stageClassName(candidate: RebuyTimingCandidate): string {
  switch (candidate.stage) {
    case "fresh":
      return "border-emerald-700/15 bg-emerald-700/8 text-emerald-950";
    case "check":
      return "border-primary-amber/25 bg-primary-amber/12 text-background-dark";
    case "overdue":
      return "border-[#B45309]/25 bg-[#B45309]/12 text-[#5A2B0B]";
  }
}

function openExternal(url: string) {
  window.open(url, "_blank", "noopener,noreferrer");
}

async function readJsonResponse(response: Response): Promise<unknown> {
  const text = await response.text();
  if (text.trim().length === 0) return {};

  try {
    return JSON.parse(text);
  } catch {
    return {};
  }
}

function readErrorMessage(json: unknown, fallbackMessage: string): string {
  if (!json || typeof json !== "object" || !("error" in json)) return fallbackMessage;
  const error = (json as { error?: unknown }).error;
  if (!error || typeof error !== "object" || !("message" in error)) return fallbackMessage;
  const message = (error as { message?: unknown }).message;
  return typeof message === "string" && message.trim().length > 0 ? message : fallbackMessage;
}

export function DashboardRebuyTimingMemoryPanel({
  cards,
  onQuickAdd,
  onSelectCard,
}: DashboardRebuyTimingMemoryPanelProps) {
  const queryClient = useQueryClient();
  const memory = buildRebuyTimingMemory(cards);
  const [copiedCardId, setCopiedCardId] = useState<string | null>(null);
  const [savingShelfCardId, setSavingShelfCardId] = useState<string | null>(null);
  const [savedShelfCardIds, setSavedShelfCardIds] = useState<readonly string[]>([]);

  async function copySearchPhrase(candidate: RebuyTimingCandidate) {
    try {
      await navigator.clipboard.writeText(candidate.searchPhrase);
      setCopiedCardId(candidate.cardId);
      window.setTimeout(() => setCopiedCardId((current) => (current === candidate.cardId ? null : current)), 1800);
    } catch {
      window.alert("검색 문장을 복사하지 못했습니다. 문장을 길게 눌러 직접 복사해주세요.");
    }
  }

  async function startShelfMemory(card: TastingCardData | null, candidate: RebuyTimingCandidate) {
    if (!card) {
      onQuickAdd();
      return;
    }

    try {
      setSavingShelfCardId(candidate.cardId);
      const response = await fetch("/api/v1/shelf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildRebuyShelfTransferPayload(card)),
      });
      const json = await readJsonResponse(response);

      if (!response.ok) {
        throw new Error(readErrorMessage(json, "재구매한 원두를 선반에 저장하지 못했습니다."));
      }

      setSavedShelfCardIds((current) => Array.from(new Set([...current, candidate.cardId])));
      await queryClient.invalidateQueries({ queryKey: ["rebuy-intelligence"] });
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "재구매한 원두를 선반에 저장하지 못했습니다.");
    } finally {
      setSavingShelfCardId(null);
    }
  }

  if (cards.length === 0) return null;

  if (memory.candidates.length === 0) {
    return (
      <section className="premium-shell mb-5" aria-label="재구매 타이밍">
        <div className="premium-card flex flex-col gap-4 p-4 sm:p-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <span className="coffee-kicker">
              <RefreshCcw size={12} />
              재구매 타이밍
            </span>
            <h2 className="mt-3 break-keep font-serif text-2xl font-black leading-tight text-background-dark">
              다시 살 원두를 하나만 표시해두세요
            </h2>
            <p className="mt-2 max-w-2xl break-keep text-sm font-bold leading-6 text-muted-foreground">
              {memory.summary}
            </p>
          </div>
          <button
            type="button"
            onClick={onQuickAdd}
            className="inline-flex min-h-11 items-center justify-center rounded-full bg-background-dark px-4 text-sm font-black text-[#fff8ec] transition hover:-translate-y-0.5"
          >
            20초 기록 남기기
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="premium-shell mb-5" aria-label="재구매 타이밍">
      <div className="premium-card p-4 sm:p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <span className="coffee-kicker">
              <Clock3 size={12} />
              재구매 타이밍
            </span>
            <h2 className="mt-3 break-keep font-serif text-2xl font-black leading-tight text-background-dark">
              기억이 흐려지기 전에 다시 살 후보를 확인하세요
            </h2>
            <p className="mt-2 max-w-2xl break-keep text-sm font-bold leading-6 text-muted-foreground">
              {memory.summary}
            </p>
          </div>
          <div className="rounded-2xl border border-background-dark/10 bg-[#fffaf2] px-4 py-3">
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-primary-amber">
              Rebuy Memory
            </p>
            <p className="mt-1 text-sm font-black text-background-dark">
              {memory.totalCandidates}개 후보 저장됨
            </p>
          </div>
        </div>

        <div className="mt-5 grid gap-3 lg:grid-cols-3">
          {memory.candidates.map((candidate) => {
            const card = findCard(cards, candidate);
            const isSavingShelf = savingShelfCardId === candidate.cardId;
            const isSavedShelf = savedShelfCardIds.includes(candidate.cardId);
            return (
              <article
                key={candidate.cardId}
                className="flex min-h-[250px] flex-col rounded-2xl border border-background-dark/10 bg-white p-4 shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <span className={`inline-flex min-h-7 items-center rounded-full border px-2.5 text-[11px] font-black ${stageClassName(candidate)}`}>
                    {candidate.stageLabel}
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
                <p className="mt-4 line-clamp-3 break-keep text-sm font-bold leading-6 text-muted-foreground">
                  {candidate.reason}
                </p>
                <div className="mt-4 rounded-2xl border border-background-dark/10 bg-[#fffaf2] p-3">
                  <p className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.16em] text-primary-amber">
                    <ShoppingBag size={12} />
                    구매 단서
                  </p>
                  <p className="mt-1 line-clamp-2 break-keep text-xs font-bold leading-5 text-background-dark">
                    {candidate.purchaseCue}
                  </p>
                </div>
                <div className="mt-3 rounded-2xl border border-primary-amber/20 bg-[#fff8ec] p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-[10px] font-black uppercase tracking-[0.16em] text-primary-amber">
                        다음 검색 문장
                      </p>
                      <p className="mt-1 line-clamp-2 break-keep text-xs font-bold leading-5 text-background-dark">
                        {candidate.searchPhrase}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => void copySearchPhrase(candidate)}
                      className="inline-flex min-h-8 shrink-0 items-center justify-center gap-1 rounded-full border border-[#8C5E35]/20 bg-white px-2.5 text-[11px] font-black text-background-dark transition hover:-translate-y-0.5"
                      aria-label={`${candidate.title} 검색 문장 복사`}
                    >
                      {copiedCardId === candidate.cardId ? <Check size={12} /> : <Copy size={12} />}
                      {copiedCardId === candidate.cardId ? "복사됨" : "복사"}
                    </button>
                  </div>
                </div>
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
                    onClick={() => openExternal(candidate.searchUrl)}
                    className="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-full bg-background-dark px-3 text-xs font-black text-[#fff8ec] transition hover:-translate-y-0.5"
                  >
                    {candidate.hasDirectPurchaseClue ? <ExternalLink size={13} /> : <Search size={13} />}
                    {candidate.actionLabel}
                  </button>
                </div>
                <button
                  type="button"
                  disabled={isSavingShelf || isSavedShelf}
                  onClick={() => void startShelfMemory(card, candidate)}
                  className="mt-2 inline-flex min-h-10 items-center justify-center gap-1.5 rounded-full border border-primary-amber/30 bg-primary-amber/10 px-3 text-xs font-black text-background-dark transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  <ShoppingBag size={13} />
                  {isSavedShelf ? "선반 기억 시작됨" : isSavingShelf ? "선반에 저장 중" : "다시 샀음, 선반 시작"}
                </button>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
