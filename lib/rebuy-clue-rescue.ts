import { hasMeaningfulCoffeeMemoryText, normalizeCoffeeMemoryText } from "@/lib/coffee-memory";

export type RebuyClueRescueCard = {
  readonly id: string;
  readonly title: string;
  readonly subtitle: string;
  readonly tags: readonly string[];
  readonly purchase_url: string | null;
  readonly purchase_note: string | null;
  readonly repurchase_intent: "again" | "maybe" | "no" | "undecided";
  readonly repurchase_reasons: readonly string[];
  readonly created_at: string;
};

export type RebuyClueKey = "purchase_place" | "purchase_price" | "purchase_link" | "rebuy_reason";

export type RebuyClueRescueCandidate = {
  readonly cardId: string;
  readonly title: string;
  readonly subtitle: string;
  readonly missingClues: readonly RebuyClueKey[];
  readonly missingLabels: readonly string[];
  readonly savedClue: string;
  readonly rescuePrompt: string;
  readonly daysSince: number;
  readonly priority: "high" | "medium" | "low";
};

export type RebuyClueRescue = {
  readonly summary: string;
  readonly totalCandidates: number;
  readonly candidates: readonly RebuyClueRescueCandidate[];
};

export type RebuyClueRescueForm = {
  readonly purchaseNote: string;
  readonly purchaseUrl: string;
  readonly rebuyReason: string;
};

export type RebuyClueRescuePatchCard = {
  readonly repurchase_reasons: readonly string[];
};

export type RebuyClueRescuePatch = {
  readonly confirmed: true;
  readonly purchaseNote: string | null;
  readonly purchaseUrl: string | null;
  readonly repurchaseReasons: readonly string[];
};

const clueLabels: Record<RebuyClueKey, string> = {
  purchase_place: "구매처",
  purchase_price: "가격",
  purchase_link: "구매 링크",
  rebuy_reason: "다시 살 이유",
};

function isNonBlank(value: string | null | undefined): value is string {
  return hasMeaningfulCoffeeMemoryText(value);
}

function readDaysSince(createdAt: string, now: Date): number {
  const createdTime = new Date(createdAt).getTime();
  if (!Number.isFinite(createdTime)) return 0;
  const diff = now.getTime() - createdTime;
  if (diff <= 0) return 0;
  return Math.floor(diff / 86_400_000);
}

function hasPriceCue(note: string | null): boolean {
  if (!isNonBlank(note)) return false;
  return /(?:₩|\$|€|원|krw|usd|\d[\d,.]*\s?(?:원|won|krw|달러|usd))/i.test(note);
}

function hasPlaceCue(note: string | null): boolean {
  if (!isNonBlank(note)) return false;
  const normalized = note.trim();
  if (hasPriceCue(normalized) && normalized.split(/\s+/).length <= 2) return false;
  return /(?:공식몰|매장|카페|구매|스토어|마켓|네이버|쿠팡|몰|shop|store|market|roaster)/i.test(normalized)
    || normalized.length >= 3;
}

function hasReason(card: RebuyClueRescueCard): boolean {
  return card.repurchase_reasons.some(isNonBlank);
}

function readMissingClues(card: RebuyClueRescueCard): readonly RebuyClueKey[] {
  const missing: RebuyClueKey[] = [];
  if (!hasPlaceCue(card.purchase_note)) missing.push("purchase_place");
  if (!hasPriceCue(card.purchase_note)) missing.push("purchase_price");
  if (!isNonBlank(card.purchase_url)) missing.push("purchase_link");
  if (!hasReason(card)) missing.push("rebuy_reason");
  return missing;
}

function readSavedClue(card: RebuyClueRescueCard): string {
  if (isNonBlank(card.purchase_note)) return card.purchase_note.trim();
  const reason = card.repurchase_reasons.find(isNonBlank);
  if (reason) return reason.trim();
  const tags = card.tags.filter(isNonBlank).slice(0, 2).join(" · ");
  if (tags) return tags;
  return "원두 이름과 로스터리만 남아 있어요.";
}

function readPriority(missingCount: number, daysSince: number): "high" | "medium" | "low" {
  if (missingCount >= 3 || daysSince >= 30) return "high";
  if (missingCount >= 2 || daysSince >= 14) return "medium";
  return "low";
}

function readRescuePrompt(card: RebuyClueRescueCard, missingLabels: readonly string[]): string {
  const labelText = missingLabels.slice(0, 3).join(" · ");
  if (card.repurchase_intent === "again") {
    return `${labelText}만 보강하면 다음에 바로 다시 찾을 수 있어요.`;
  }
  return `${labelText}를 남겨두면 고민 중인 원두도 나중에 비교하기 쉬워요.`;
}

function readIntentScore(intent: RebuyClueRescueCard["repurchase_intent"]): number {
  if (intent === "again") return 40;
  if (intent === "maybe") return 24;
  return 0;
}

export function buildRebuyClueRescue(
  cards: readonly RebuyClueRescueCard[],
  now: Date = new Date(),
): RebuyClueRescue {
  const candidates = cards
    .filter((card) => card.repurchase_intent === "again" || card.repurchase_intent === "maybe")
    .map((card) => {
      const missingClues = readMissingClues(card);
      const daysSince = readDaysSince(card.created_at, now);
      const score = readIntentScore(card.repurchase_intent) + missingClues.length * 10 + Math.min(daysSince, 45);
      const missingLabels = missingClues.map((clue) => clueLabels[clue]);
      return {
        candidate: {
          cardId: card.id,
          title: card.title,
          subtitle: card.subtitle,
          missingClues,
          missingLabels,
          savedClue: readSavedClue(card),
          rescuePrompt: readRescuePrompt(card, missingLabels),
          daysSince,
          priority: readPriority(missingClues.length, daysSince),
        } satisfies RebuyClueRescueCandidate,
        score,
      };
    })
    .filter(({ candidate }) => candidate.missingClues.length > 0)
    .sort((left, right) => right.score - left.score || right.candidate.daysSince - left.candidate.daysSince)
    .map(({ candidate }) => candidate);

  if (candidates.length === 0) {
    return {
      summary: "다시 살 후보마다 구매처, 가격, 링크, 이유가 충분히 남아 있어요.",
      totalCandidates: 0,
      candidates: [],
    };
  }

  return {
    summary: `${candidates.length}개 재구매 후보에 빠진 단서가 있어요. 구매처, 가격, 링크, 이유를 보강하면 다음 구매가 쉬워집니다.`,
    totalCandidates: candidates.length,
    candidates: candidates.slice(0, 3),
  };
}

export function buildRebuyClueRescuePatch(
  card: RebuyClueRescuePatchCard,
  form: RebuyClueRescueForm,
): RebuyClueRescuePatch {
  const purchaseNote = normalizeCoffeeMemoryText(form.purchaseNote);
  const purchaseUrl = normalizeCoffeeMemoryText(form.purchaseUrl);
  const rebuyReason = normalizeCoffeeMemoryText(form.rebuyReason);
  const existingReasons = card.repurchase_reasons.map(normalizeCoffeeMemoryText).filter(Boolean);
  const repurchaseReasons = rebuyReason
    ? Array.from(new Set([rebuyReason, ...existingReasons])).slice(0, 8)
    : existingReasons.slice(0, 8);

  return {
    confirmed: true,
    purchaseNote: purchaseNote || null,
    purchaseUrl: purchaseUrl || null,
    repurchaseReasons,
  };
}

export function hasRebuyClueRescueProgress(
  card: RebuyClueRescueCard,
  form: RebuyClueRescueForm,
): boolean {
  const patch = buildRebuyClueRescuePatch(card, form);
  const updatedCard: RebuyClueRescueCard = {
    ...card,
    purchase_note: patch.purchaseNote,
    purchase_url: patch.purchaseUrl,
    repurchase_reasons: patch.repurchaseReasons,
  };

  return readMissingClues(updatedCard).length < readMissingClues(card).length;
}
