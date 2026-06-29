import { evaluateFreshShelfStatus } from "@/lib/fresh-shelf";

export type RebuyIntelligenceCard = {
  readonly id: string;
  readonly title: string;
  readonly subtitle: string;
  readonly metric1: number;
  readonly metric2: number;
  readonly metric3: number;
  readonly tags: readonly string[];
  readonly repurchase_intent: "again" | "maybe" | "no" | "undecided";
  readonly repurchase_reasons: readonly string[];
  readonly scan_source: "gemini" | "manual" | null;
  readonly package_origin: string | null;
  readonly package_process: string | null;
  readonly footer_meta?: {
    readonly origin?: string;
    readonly extraInfo?: string;
  };
  readonly created_at: string;
};

export type RebuyIntelligenceShelfItem = {
  readonly id: string;
  readonly roaster_name: string;
  readonly bean_name: string;
  readonly origin: string | null;
  readonly roast_date: string | null;
  readonly opened_date: string | null;
  readonly fill_level: number;
  readonly is_finished: boolean;
  readonly tasting_card_id: string | null;
  readonly created_at?: string;
};

export type RebuyIntelligenceBrewLog = {
  readonly id: string;
  readonly shelf_item_id: string | null;
  readonly brewed_at: string;
  readonly method: string;
  readonly parameters: Record<string, unknown>;
  readonly rating: number | null;
  readonly simple_note: string | null;
  readonly coffee_shelf_items?: RebuyIntelligenceShelfItem | readonly RebuyIntelligenceShelfItem[] | null;
};

export type RebuyReminderInsight = {
  readonly title: string;
  readonly subtitle: string;
  readonly reason: string;
  readonly actionLabel: string;
  readonly priority: "high" | "medium" | "low";
  readonly cardId: string | null;
  readonly shelfItemId: string | null;
};

export type TasteMatchInsight = {
  readonly anchorCardId: string | null;
  readonly anchorTitle: string;
  readonly matchCardId: string | null;
  readonly matchTitle: string;
  readonly sharedTags: readonly string[];
  readonly reason: string;
  readonly searchPrompt: string;
};

export type PurchaseMemoryInsight = {
  readonly title: string;
  readonly subtitle: string;
  readonly source: "scan" | "shelf" | "manual";
  readonly searchUrl: string;
  readonly reason: string;
  readonly cardId: string | null;
  readonly shelfItemId: string | null;
};

export type BrewFailureInsight = {
  readonly title: string;
  readonly subtitle: string;
  readonly problem: "too_sour" | "too_bitter" | "weak" | "dry" | "unknown";
  readonly adjustment: string;
  readonly evidence: string;
  readonly logId: string | null;
  readonly shelfItemId: string | null;
};

export type RebuyIntelligenceResponse = {
  readonly data: {
    readonly generatedAt: string;
    readonly summary: string;
    readonly featureScores: readonly {
      readonly feature: "rebuy_reminder" | "taste_match" | "purchase_memory" | "brew_failure_memory";
      readonly roi: number;
      readonly retention: number;
      readonly painkiller: number;
      readonly monetization: number;
      readonly difficulty: number;
      readonly reason: string;
    }[];
    readonly rebuyReminder: RebuyReminderInsight;
    readonly tasteMatch: TasteMatchInsight;
    readonly purchaseMemory: PurchaseMemoryInsight;
    readonly brewFailureMemory: BrewFailureInsight;
  };
};

type BuildRebuyIntelligenceInput = {
  readonly cards: readonly RebuyIntelligenceCard[];
  readonly shelfItems: readonly RebuyIntelligenceShelfItem[];
  readonly brewingLogs: readonly RebuyIntelligenceBrewLog[];
  readonly now?: Date;
};

const fallbackReminder: RebuyReminderInsight = {
  title: "첫 재구매 기억을 만들 차례",
  subtitle: "CoffeeDex",
  reason: "좋았던 원두를 하나만 다시 살 후보로 표시하면 다음 방문 때 바로 꺼낼 수 있어요.",
  actionLabel: "빠른 기록 남기기",
  priority: "low",
  cardId: null,
  shelfItemId: null,
};

const fallbackTasteMatch: TasteMatchInsight = {
  anchorCardId: null,
  anchorTitle: "취향 기준이 아직 부족해요",
  matchCardId: null,
  matchTitle: "좋았던 원두 2개를 저장하면 비슷한 기준을 만들 수 있어요.",
  sharedTags: [],
  reason: "산미, 단맛, 바디와 태그가 쌓이면 다음 구매 기준을 자동으로 요약합니다.",
  searchPrompt: "CoffeeDex에 좋았던 원두와 맛 태그를 저장하기",
};

const fallbackPurchaseMemory: PurchaseMemoryInsight = {
  title: "구매 단서가 아직 없어요",
  subtitle: "Bag Scan",
  source: "manual",
  searchUrl: "https://www.google.com/search?q=CoffeeDex%20coffee%20beans",
  reason: "봉투 스캔이나 로스터명을 남기면 다음 재구매 검색을 바로 열 수 있어요.",
  cardId: null,
  shelfItemId: null,
};

const fallbackBrewFailure: BrewFailureInsight = {
  title: "실패 컵도 다음 컵의 레시피가 됩니다",
  subtitle: "Brew Failure Memory",
  problem: "unknown",
  adjustment: "맛이 아쉬웠던 컵에 산미, 쓴맛, 묽음 같은 단서를 남겨두세요.",
  evidence: "실패 로그가 쌓이면 다음 조정값을 바로 제안합니다.",
  logId: null,
  shelfItemId: null,
};

function normalize(value: string): string {
  return value.normalize("NFKC").toLocaleLowerCase("ko-KR").trim();
}

function recencyTime(value: string | undefined): number {
  if (!value) return 0;
  const parsed = new Date(value).getTime();
  return Number.isFinite(parsed) ? parsed : 0;
}

function cardLabel(card: RebuyIntelligenceCard): string {
  return `${card.subtitle} ${card.title}`.trim();
}

function shelfLabel(item: RebuyIntelligenceShelfItem): string {
  return `${item.roaster_name} ${item.bean_name}`.trim();
}

function purchaseSearchUrl(label: string): string {
  return `https://www.google.com/search?q=${encodeURIComponent(`${label} 원두 구매`)}`;
}

function buildRebuyReminder(
  cards: readonly RebuyIntelligenceCard[],
  shelfItems: readonly RebuyIntelligenceShelfItem[],
  now: Date,
): RebuyReminderInsight {
  const shelfCandidates = shelfItems
    .map((item) => ({
      item,
      status: evaluateFreshShelfStatus({
        roastDate: item.roast_date,
        openedDate: item.opened_date,
        fillLevel: item.fill_level,
        isFinished: item.is_finished,
        now,
      }),
    }))
    .filter(({ status }) => status.kind === "rebuy" || status.kind === "finish_soon")
    .sort((first, second) => {
      const priority = { rebuy: 0, finish_soon: 1, drink_now: 2, waiting: 3 };
      return priority[first.status.kind] - priority[second.status.kind]
        || first.item.fill_level - second.item.fill_level;
    });

  const shelfCandidate = shelfCandidates[0];
  if (shelfCandidate) {
    return {
      title: shelfCandidate.item.bean_name,
      subtitle: shelfCandidate.item.roaster_name,
      reason: shelfCandidate.status.reason,
      actionLabel: shelfCandidate.status.kind === "rebuy" ? "재구매 후보 열기" : "마시고 판단하기",
      priority: shelfCandidate.status.kind === "rebuy" ? "high" : "medium",
      cardId: shelfCandidate.item.tasting_card_id,
      shelfItemId: shelfCandidate.item.id,
    };
  }

  const cardCandidate = cards
    .filter((card) => card.repurchase_intent === "again")
    .sort((first, second) => recencyTime(second.created_at) - recencyTime(first.created_at))[0];

  if (!cardCandidate) return fallbackReminder;

  return {
    title: cardCandidate.title,
    subtitle: cardCandidate.subtitle,
    reason: cardCandidate.repurchase_reasons[0] ?? "다시 사고 싶은 카드로 저장되어 있어요.",
    actionLabel: "기억 열기",
    priority: "medium",
    cardId: cardCandidate.id,
    shelfItemId: null,
  };
}

function cardMatchScore(anchor: RebuyIntelligenceCard, candidate: RebuyIntelligenceCard): number {
  const anchorTags = new Set(anchor.tags.map(normalize));
  const sharedTagScore = candidate.tags.filter((tag) => anchorTags.has(normalize(tag))).length * 3;
  const metricDistance = Math.abs(anchor.metric1 - candidate.metric1)
    + Math.abs(anchor.metric2 - candidate.metric2)
    + Math.abs(anchor.metric3 - candidate.metric3);
  const rebuyScore = candidate.repurchase_intent === "again" ? 3 : candidate.repurchase_intent === "maybe" ? 1 : 0;

  return sharedTagScore + rebuyScore + Math.max(0, 6 - metricDistance);
}

function buildTasteMatch(cards: readonly RebuyIntelligenceCard[]): TasteMatchInsight {
  const anchor = [...cards]
    .filter((card) => card.repurchase_intent === "again" || card.repurchase_intent === "maybe")
    .sort((first, second) => {
      const intentScore = { again: 0, maybe: 1, undecided: 2, no: 3 };
      return intentScore[first.repurchase_intent] - intentScore[second.repurchase_intent]
        || recencyTime(second.created_at) - recencyTime(first.created_at);
    })[0] ?? cards[0];

  if (!anchor) return fallbackTasteMatch;

  const match = cards
    .filter((card) => card.id !== anchor.id)
    .map((card) => ({ card, score: cardMatchScore(anchor, card) }))
    .sort((first, second) => second.score - first.score)[0]?.card;

  const anchorTags = new Set(anchor.tags.map(normalize));
  const sharedTags = match
    ? match.tags.filter((tag) => anchorTags.has(normalize(tag))).slice(0, 4)
    : anchor.tags.slice(0, 4);
  const tasteBasis = [
    ...sharedTags,
    anchor.package_origin,
    anchor.package_process,
  ].filter((value): value is string => typeof value === "string" && value.trim().length > 0);

  return {
    anchorCardId: anchor.id,
    anchorTitle: cardLabel(anchor),
    matchCardId: match?.id ?? null,
    matchTitle: match ? cardLabel(match) : "다음 구매 후보를 고를 기준",
    sharedTags,
    reason: match
      ? `${sharedTags.length > 0 ? sharedTags.join(", ") : "비슷한 점수"} 기준으로 가까운 기억입니다.`
      : "좋았던 카드의 맛 기준을 다음 구매 검색어로 바꿨어요.",
    searchPrompt: tasteBasis.length > 0
      ? `${anchor.subtitle} ${tasteBasis.join(" ")} 비슷한 원두`
      : `${anchor.subtitle} ${anchor.title} 비슷한 원두`,
  };
}

function buildPurchaseMemory(
  cards: readonly RebuyIntelligenceCard[],
  shelfItems: readonly RebuyIntelligenceShelfItem[],
): PurchaseMemoryInsight {
  const shelfCandidate = shelfItems
    .filter((item) => item.roaster_name.trim().length > 0 && item.bean_name.trim().length > 0)
    .sort((first, second) => {
      const fillPriority = Number(first.fill_level <= 25 || first.is_finished) - Number(second.fill_level <= 25 || second.is_finished);
      return fillPriority * -1 || recencyTime(second.created_at) - recencyTime(first.created_at);
    })[0];

  if (shelfCandidate) {
    const label = shelfLabel(shelfCandidate);
    return {
      title: shelfCandidate.bean_name,
      subtitle: shelfCandidate.roaster_name,
      source: "shelf",
      searchUrl: purchaseSearchUrl(label),
      reason: shelfCandidate.origin ? `${shelfCandidate.origin} 단서까지 함께 기억합니다.` : "서랍에 남긴 로스터와 원두명으로 재구매 검색을 열 수 있어요.",
      cardId: shelfCandidate.tasting_card_id,
      shelfItemId: shelfCandidate.id,
    };
  }

  const cardCandidate = cards
    .filter((card) => card.repurchase_intent === "again" || card.scan_source !== null)
    .sort((first, second) => recencyTime(second.created_at) - recencyTime(first.created_at))[0];

  if (!cardCandidate) return fallbackPurchaseMemory;

  return {
    title: cardCandidate.title,
    subtitle: cardCandidate.subtitle,
    source: cardCandidate.scan_source ? "scan" : "manual",
    searchUrl: purchaseSearchUrl(cardLabel(cardCandidate)),
    reason: cardCandidate.scan_source ? "봉투 스캔으로 남긴 패키지 단서를 재구매 검색으로 이어갑니다." : "카드에 남긴 로스터와 원두명으로 재구매 검색을 열 수 있어요.",
    cardId: cardCandidate.id,
    shelfItemId: null,
  };
}

function classifyFailure(note: string): BrewFailureInsight["problem"] {
  const normalized = normalize(note);
  if (/(sour|acid|시큼|시다|산미.*강|under)/.test(normalized)) return "too_sour";
  if (/(bitter|쓴|떫|over)/.test(normalized)) return "too_bitter";
  if (/(watery|weak|연하|묽|밍밍)/.test(normalized)) return "weak";
  if (/(dry|건조|텁텁)/.test(normalized)) return "dry";
  return "unknown";
}

function adjustmentFor(problem: BrewFailureInsight["problem"]): string {
  switch (problem) {
    case "too_sour":
      return "다음 컵은 분쇄를 조금 더 곱게 하거나 물 온도를 1-2도 올려보세요.";
    case "too_bitter":
      return "다음 컵은 분쇄를 조금 더 굵게 하거나 추출 시간을 짧게 가져가세요.";
    case "weak":
      return "다음 컵은 원두량을 늘리거나 물 비율을 낮춰 농도를 올려보세요.";
    case "dry":
      return "다음 컵은 추출 후반을 줄이고 물 온도를 살짝 낮춰보세요.";
    case "unknown":
      return "다음 컵에서 분쇄도, 온도, 비율 중 하나만 바꿔 기록해보세요.";
  }
}

function isJoinedShelfItemArray(
  value: RebuyIntelligenceBrewLog["coffee_shelf_items"],
): value is readonly RebuyIntelligenceShelfItem[] {
  return Array.isArray(value);
}

function readJoinedShelfItem(
  value: RebuyIntelligenceBrewLog["coffee_shelf_items"],
): RebuyIntelligenceShelfItem | null {
  if (!value) return null;
  if (isJoinedShelfItemArray(value)) return value[0] ?? null;
  return value;
}

function buildBrewFailureMemory(brewingLogs: readonly RebuyIntelligenceBrewLog[]): BrewFailureInsight {
  const failureLog = [...brewingLogs]
    .filter((log) => (log.rating !== null && log.rating <= 2) || (log.simple_note ?? "").trim().length > 0)
    .sort((first, second) => {
      const firstRatingScore = first.rating !== null && first.rating <= 2 ? 0 : 1;
      const secondRatingScore = second.rating !== null && second.rating <= 2 ? 0 : 1;
      return firstRatingScore - secondRatingScore
        || recencyTime(second.brewed_at) - recencyTime(first.brewed_at);
    })[0];

  if (!failureLog) return fallbackBrewFailure;

  const shelfItem = readJoinedShelfItem(failureLog.coffee_shelf_items);
  const problem = classifyFailure(failureLog.simple_note ?? "");

  return {
    title: shelfItem?.bean_name ?? failureLog.method,
    subtitle: shelfItem?.roaster_name ?? failureLog.method,
    problem,
    adjustment: adjustmentFor(problem),
    evidence: failureLog.simple_note?.trim() || `평점 ${failureLog.rating ?? "-"}점으로 남긴 추출 로그입니다.`,
    logId: failureLog.id,
    shelfItemId: failureLog.shelf_item_id,
  };
}

export function buildRebuyIntelligence(input: BuildRebuyIntelligenceInput): RebuyIntelligenceResponse["data"] {
  const now = input.now ?? new Date();
  const rebuyReminder = buildRebuyReminder(input.cards, input.shelfItems, now);
  const tasteMatch = buildTasteMatch(input.cards);
  const purchaseMemory = buildPurchaseMemory(input.cards, input.shelfItems);
  const brewFailureMemory = buildBrewFailureMemory(input.brewingLogs);

  return {
    generatedAt: now.toISOString(),
    summary: "재구매 시점, 취향 기준, 구매 단서, 실패 보정값을 한 번에 이어주는 반복 사용 루프입니다.",
    featureScores: [
      {
        feature: "rebuy_reminder",
        roi: 92,
        retention: 95,
        painkiller: 90,
        monetization: 72,
        difficulty: 28,
        reason: "원두가 줄어드는 실제 순간에 다시 방문할 이유를 만듭니다.",
      },
      {
        feature: "purchase_memory",
        roi: 87,
        retention: 86,
        painkiller: 88,
        monetization: 80,
        difficulty: 35,
        reason: "스캔과 서랍 데이터를 재구매 검색 행동으로 연결합니다.",
      },
      {
        feature: "brew_failure_memory",
        roi: 82,
        retention: 88,
        painkiller: 84,
        monetization: 68,
        difficulty: 38,
        reason: "맛없던 컵을 다음 컵 개선으로 바꿔 기록 가치를 높입니다.",
      },
      {
        feature: "taste_match",
        roi: 78,
        retention: 82,
        painkiller: 78,
        monetization: 76,
        difficulty: 46,
        reason: "좋아한 카드가 쌓일수록 다음 구매 기준이 더 선명해집니다.",
      },
    ],
    rebuyReminder,
    tasteMatch,
    purchaseMemory,
    brewFailureMemory,
  };
}
