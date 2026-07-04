export type RebuyTimingMemoryCard = {
  readonly id: string;
  readonly title: string;
  readonly subtitle: string;
  readonly tags: readonly string[];
  readonly repurchase_intent: "again" | "maybe" | "no" | "undecided";
  readonly repurchase_reasons: readonly string[];
  readonly purchase_url: string | null;
  readonly purchase_note: string | null;
  readonly footer_meta?: {
    readonly date?: string;
    readonly origin?: string;
    readonly extraInfo?: string;
  };
  readonly confirmed_at?: string | null;
  readonly created_at: string;
  readonly updated_at?: string;
};

export type RebuyTimingStage = "fresh" | "check" | "overdue";

export type RebuyTimingCandidate = {
  readonly cardId: string;
  readonly title: string;
  readonly subtitle: string;
  readonly stage: RebuyTimingStage;
  readonly stageLabel: string;
  readonly daysSince: number;
  readonly reason: string;
  readonly purchaseCue: string;
  readonly searchUrl: string;
  readonly actionLabel: string;
  readonly hasDirectPurchaseClue: boolean;
};

export type RebuyTimingMemory = {
  readonly totalCandidates: number;
  readonly summary: string;
  readonly candidates: readonly RebuyTimingCandidate[];
};

const DAY_IN_MS = 24 * 60 * 60 * 1000;

function isNonBlank(value: string | null | undefined): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function parseDateTime(value: string | null | undefined): number {
  if (!isNonBlank(value)) return 0;
  const parsed = new Date(value).getTime();
  return Number.isFinite(parsed) ? parsed : 0;
}

function bestMemoryTime(card: RebuyTimingMemoryCard): number {
  return Math.max(
    parseDateTime(card.footer_meta?.date),
    parseDateTime(card.confirmed_at),
    parseDateTime(card.updated_at),
    parseDateTime(card.created_at),
  );
}

function daysBetween(now: Date, thenTime: number): number {
  if (thenTime <= 0) return 0;
  return Math.max(0, Math.floor((now.getTime() - thenTime) / DAY_IN_MS));
}

function stageFor(daysSince: number): RebuyTimingStage {
  if (daysSince <= 14) return "fresh";
  if (daysSince <= 45) return "check";
  return "overdue";
}

function labelFor(stage: RebuyTimingStage): string {
  switch (stage) {
    case "fresh":
      return "기억 선명";
    case "check":
      return "다시 확인";
    case "overdue":
      return "놓치기 전";
  }
}

function actionLabelFor(stage: RebuyTimingStage, hasDirectPurchaseClue: boolean): string {
  if (hasDirectPurchaseClue) return "구매 단서 열기";
  if (stage === "fresh") return "카드 다시 보기";
  return "원두 검색하기";
}

function buildSearchUrl(card: RebuyTimingMemoryCard): string {
  const query = [card.subtitle, card.title, ...card.tags.slice(0, 2), "원두 구매"]
    .filter(isNonBlank)
    .join(" ");
  return `https://www.google.com/search?q=${encodeURIComponent(query || "원두 구매")}`;
}

function reasonFor(card: RebuyTimingMemoryCard, daysSince: number): string {
  const reason = card.repurchase_reasons.find(isNonBlank);
  if (reason) return reason;
  if (card.repurchase_intent === "again") return `${daysSince}일 전 다시 살 원두로 남긴 기억입니다.`;
  if (card.repurchase_intent === "maybe") return `${daysSince}일 전 고민 후보로 남긴 원두입니다.`;
  return `${daysSince}일 전 저장한 구매 단서가 남아 있어요.`;
}

function purchaseCueFor(card: RebuyTimingMemoryCard): string {
  if (isNonBlank(card.purchase_note)) return card.purchase_note;
  if (isNonBlank(card.purchase_url)) return "저장한 구매 링크가 있어요.";
  const label = [card.subtitle, card.title].filter(isNonBlank).join(" · ");
  return label || "원두 이름과 로스터리를 검색 단서로 남겼어요.";
}

function candidateScore(card: RebuyTimingMemoryCard, stage: RebuyTimingStage): number {
  const intentScore = {
    again: 100,
    maybe: 72,
    undecided: 42,
    no: 0,
  }[card.repurchase_intent];
  const stageScore = {
    overdue: 36,
    check: 26,
    fresh: 12,
  }[stage];
  const purchaseClueScore = isNonBlank(card.purchase_url) || isNonBlank(card.purchase_note) ? 18 : 0;
  const reasonScore = card.repurchase_reasons.some(isNonBlank) ? 8 : 0;

  return intentScore + stageScore + purchaseClueScore + reasonScore;
}

function isRebuyCandidate(card: RebuyTimingMemoryCard): boolean {
  if (card.repurchase_intent === "again" || card.repurchase_intent === "maybe") return true;
  return isNonBlank(card.purchase_url) || isNonBlank(card.purchase_note);
}

export function buildRebuyTimingMemory(
  cards: readonly RebuyTimingMemoryCard[],
  now: Date = new Date(),
  limit = 3,
): RebuyTimingMemory {
  const ranked = cards
    .filter(isRebuyCandidate)
    .map((card) => {
      const memoryTime = bestMemoryTime(card);
      const daysSince = daysBetween(now, memoryTime);
      const stage = stageFor(daysSince);
      const hasDirectPurchaseClue = isNonBlank(card.purchase_url) || isNonBlank(card.purchase_note);
      const searchUrl = isNonBlank(card.purchase_url) ? card.purchase_url : buildSearchUrl(card);

      return {
        score: candidateScore(card, stage),
        memoryTime,
        candidate: {
          cardId: card.id,
          title: card.title,
          subtitle: card.subtitle,
          stage,
          stageLabel: labelFor(stage),
          daysSince,
          reason: reasonFor(card, daysSince),
          purchaseCue: purchaseCueFor(card),
          searchUrl,
          actionLabel: actionLabelFor(stage, hasDirectPurchaseClue),
          hasDirectPurchaseClue,
        } satisfies RebuyTimingCandidate,
      };
    })
    .filter(({ score }) => score > 0)
    .sort((first, second) => second.score - first.score || first.memoryTime - second.memoryTime);

  const candidates = ranked.slice(0, Math.max(0, limit)).map(({ candidate }) => candidate);
  const overdueCount = ranked.filter(({ candidate }) => candidate.stage === "overdue").length;
  const summary = ranked.length === 0
    ? "다시 살 원두를 하나만 표시하면 다음 방문 때 이름과 로스터리를 바로 꺼내드릴게요."
    : `${ranked.length}개 후보 중 ${overdueCount}개는 기억이 흐려지기 전에 다시 확인할 타이밍입니다.`;

  return {
    totalCandidates: ranked.length,
    summary,
    candidates,
  };
}
