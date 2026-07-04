export type RebuyTasteBriefCard = {
  readonly id: string;
  readonly title: string;
  readonly subtitle: string;
  readonly tags: readonly string[];
  readonly metric1: number;
  readonly metric2: number;
  readonly metric3: number;
  readonly package_origin: string | null;
  readonly package_process: string | null;
  readonly repurchase_intent: "again" | "maybe" | "no" | "undecided";
  readonly repurchase_reasons: readonly string[];
  readonly ai_description: string;
  readonly footer_meta?: {
    readonly date?: string;
    readonly origin?: string;
    readonly extraInfo?: string;
  };
  readonly confirmed_at?: string | null;
  readonly created_at: string;
  readonly updated_at?: string;
};

export type RebuyTasteBrief = {
  readonly totalSourceCards: number;
  readonly flavorTags: readonly string[];
  readonly sampleCards: readonly string[];
  readonly preferenceLine: string;
  readonly orderPhrase: string;
  readonly evidence: readonly string[];
};

const MAX_TAGS = 5;
const MAX_SAMPLE_CARDS = 2;

function isNonBlank(value: string | null | undefined): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function parseDateTime(value: string | null | undefined): number {
  if (!isNonBlank(value)) return 0;
  const parsed = new Date(value).getTime();
  return Number.isFinite(parsed) ? parsed : 0;
}

function memoryTime(card: RebuyTasteBriefCard): number {
  return Math.max(
    parseDateTime(card.footer_meta?.date),
    parseDateTime(card.confirmed_at),
    parseDateTime(card.updated_at),
    parseDateTime(card.created_at),
  );
}

function sourceCards(cards: readonly RebuyTasteBriefCard[]): readonly RebuyTasteBriefCard[] {
  const again = cards.filter((card) => card.repurchase_intent === "again");
  const maybe = cards.filter((card) => card.repurchase_intent === "maybe");
  return (again.length > 0 ? again : maybe)
    .slice()
    .sort((first, second) => {
      const reasonDelta = Number(second.repurchase_reasons.some(isNonBlank)) - Number(first.repurchase_reasons.some(isNonBlank));
      return reasonDelta || memoryTime(second) - memoryTime(first);
    });
}

function topTags(cards: readonly RebuyTasteBriefCard[]): readonly string[] {
  const counts = new Map<string, number>();
  for (const card of cards) {
    for (const tag of card.tags) {
      const normalized = tag.trim();
      if (normalized.length === 0) continue;
      counts.set(normalized, (counts.get(normalized) ?? 0) + 1);
    }
  }

  return Array.from(counts.entries())
    .sort((first, second) => second[1] - first[1] || first[0].localeCompare(second[0]))
    .slice(0, MAX_TAGS)
    .map(([tag]) => tag);
}

function average(cards: readonly RebuyTasteBriefCard[], metric: "metric1" | "metric2" | "metric3"): number {
  if (cards.length === 0) return 0;
  const total = cards.reduce((sum, card) => sum + card[metric], 0);
  return total / cards.length;
}

function acidityLabel(value: number): string {
  if (value >= 4) return "밝은 산미";
  if (value <= 2.5) return "낮은 산미";
  return "부드러운 산미";
}

function sweetnessLabel(value: number): string {
  if (value >= 4) return "단맛이 선명한";
  if (value <= 2.5) return "단맛이 절제된";
  return "은은한 단맛의";
}

function bodyLabel(value: number): string {
  if (value >= 4) return "바디감 있는";
  if (value <= 2.5) return "가벼운 바디의";
  return "균형 잡힌 바디의";
}

function sampleCardLabel(card: RebuyTasteBriefCard): string {
  return [card.subtitle, card.title].filter(isNonBlank).join(" · ") || card.title;
}

function preferenceEvidence(cards: readonly RebuyTasteBriefCard[]): readonly string[] {
  const process = cards.map((card) => card.package_process).find(isNonBlank);
  const origin = cards.map((card) => card.package_origin ?? card.footer_meta?.origin).find(isNonBlank);
  const reason = cards.flatMap((card) => card.repurchase_reasons).find(isNonBlank);

  return [
    `${cards.length}개의 다시 살 후보에서 만든 문장`,
    process ? `${process} 프로세스가 포함된 기록 있음` : null,
    origin ? `${origin} 산지 기억 포함` : null,
    reason ? `좋았던 이유: ${reason}` : null,
  ].filter(isNonBlank);
}

export function buildRebuyTasteBrief(cards: readonly RebuyTasteBriefCard[]): RebuyTasteBrief | null {
  const candidates = sourceCards(cards);
  if (candidates.length === 0) return null;

  const flavorTags = topTags(candidates);
  const tagPhrase = flavorTags.length > 0 ? flavorTags.slice(0, 3).join(", ") : "다시 사고 싶다고 남긴 향미";
  const acidity = acidityLabel(average(candidates, "metric1"));
  const sweetness = sweetnessLabel(average(candidates, "metric2"));
  const body = bodyLabel(average(candidates, "metric3"));
  const sampleCards = candidates.slice(0, MAX_SAMPLE_CARDS).map(sampleCardLabel);
  const samplePhrase = sampleCards.length > 0 ? sampleCards.join(" / ") : "저장한 재구매 후보";
  const preferenceLine = `${tagPhrase} 계열에 ${acidity}, ${sweetness} ${body} 원두를 다시 찾는 편이에요.`;
  const orderPhrase = `저는 ${tagPhrase} 느낌이 있고 ${acidity}, ${sweetness} ${body} 원두를 좋아해요. 예전에 좋았던 원두는 ${samplePhrase}입니다.`;

  return {
    totalSourceCards: candidates.length,
    flavorTags,
    sampleCards,
    preferenceLine,
    orderPhrase,
    evidence: preferenceEvidence(candidates),
  };
}
