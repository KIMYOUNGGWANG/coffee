const DAY_MS = 24 * 60 * 60 * 1000;
const DEFAULT_COFFEE_PER_CUP_GRAMS = 15;

export type ShelfRunwayInput = {
  readonly totalWeight: number;
  readonly fillLevel: number;
  readonly openedDate?: string | null;
  readonly now?: Date;
};

export type ShelfRunway = {
  readonly remainingGrams: number;
  readonly cupsRemaining: number;
  readonly estimatedDaysLeft: number | null;
  readonly suggestedRebuyDate: string | null;
  readonly label: string;
  readonly reason: string;
};

function clampPercentage(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function parseDate(dateValue: string | null | undefined): Date | null {
  if (!dateValue) return null;
  const parsed = new Date(`${dateValue}T00:00:00.000Z`);
  return Number.isFinite(parsed.getTime()) ? parsed : null;
}

function formatDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function daysSince(dateValue: string | null | undefined, now: Date): number | null {
  const parsed = parseDate(dateValue);
  if (!parsed) return null;
  return Math.max(1, Math.floor((now.getTime() - parsed.getTime()) / DAY_MS));
}

export function evaluateShelfRunway(input: ShelfRunwayInput): ShelfRunway {
  const now = input.now ?? new Date();
  const totalWeight = Math.max(0, Math.round(input.totalWeight));
  const fillLevel = clampPercentage(input.fillLevel);
  const remainingGrams = Math.round(totalWeight * (fillLevel / 100));
  const cupsRemaining = Math.max(0, Math.ceil(remainingGrams / DEFAULT_COFFEE_PER_CUP_GRAMS));
  const openedAgeDays = daysSince(input.openedDate, now);
  const consumedGrams = Math.max(0, totalWeight - remainingGrams);
  const consumedCups = consumedGrams / DEFAULT_COFFEE_PER_CUP_GRAMS;
  const cupsPerDay = openedAgeDays && consumedCups > 0 ? consumedCups / openedAgeDays : null;
  const estimatedDaysLeft = cupsPerDay ? Math.max(1, Math.ceil(cupsRemaining / cupsPerDay)) : null;
  const suggestedRebuyDate = estimatedDaysLeft
    ? formatDate(new Date(now.getTime() + Math.max(0, estimatedDaysLeft - 3) * DAY_MS))
    : null;

  if (cupsRemaining <= 1) {
    return {
      remainingGrams,
      cupsRemaining,
      estimatedDaysLeft,
      suggestedRebuyDate: formatDate(now),
      label: "마지막 컵",
      reason: "거의 비었습니다. 마음에 들었다면 오늘 다시 살 후보로 고정하세요.",
    };
  }

  if (estimatedDaysLeft !== null) {
    return {
      remainingGrams,
      cupsRemaining,
      estimatedDaysLeft,
      suggestedRebuyDate,
      label: `${cupsRemaining}잔 남음`,
      reason: `지금 속도면 약 ${estimatedDaysLeft}일 뒤 비어요. ${suggestedRebuyDate}에 다시 살지 보면 좋아요.`,
    };
  }

  return {
    remainingGrams,
    cupsRemaining,
    estimatedDaysLeft,
    suggestedRebuyDate,
    label: `${cupsRemaining}잔 남음`,
    reason: "개봉일과 잔량을 업데이트하면 예상 소진일과 재구매일을 계산합니다.",
  };
}
