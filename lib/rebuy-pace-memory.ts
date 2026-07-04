import { readPurchaseBagWeight } from "./rebuy-purchase-memory";

export type RebuyPaceStage = "unknown" | "stocked" | "ready" | "late";

export type RebuyPaceMemory = {
  readonly stage: RebuyPaceStage;
  readonly cups: number | null;
  readonly cupsLabel: string | null;
  readonly timingLabel: string | null;
  readonly detailLabel: string | null;
  readonly hasCue: boolean;
};

const DEFAULT_GRAMS_PER_CUP = 15;

function labelFor(daysSince: number, cups: number): { stage: RebuyPaceStage; timingLabel: string } {
  if (daysSince <= Math.ceil(cups * 0.6)) {
    return {
      stage: "stocked",
      timingLabel: `${daysSince}일 전 기록, 아직 여유 가능성`,
    };
  }

  if (daysSince <= cups + 7) {
    return {
      stage: "ready",
      timingLabel: `${daysSince}일 전 기록, 다시 살 타이밍`,
    };
  }

  return {
    stage: "late",
    timingLabel: `${daysSince}일 전 기록, 놓치기 전 재확인`,
  };
}

export function buildRebuyPaceMemory(
  purchaseNote: string | null,
  daysSince: number,
  gramsPerCup = DEFAULT_GRAMS_PER_CUP,
): RebuyPaceMemory {
  const bagWeight = readPurchaseBagWeight(purchaseNote);
  if (!bagWeight || gramsPerCup <= 0) {
    return {
      stage: "unknown",
      cups: null,
      cupsLabel: null,
      timingLabel: null,
      detailLabel: null,
      hasCue: false,
    };
  }

  const cups = Math.max(1, Math.round(bagWeight / gramsPerCup));
  const normalizedDaysSince = Math.max(0, Math.round(daysSince));
  const pace = labelFor(normalizedDaysSince, cups);

  return {
    stage: pace.stage,
    cups,
    cupsLabel: `약 ${cups}잔분`,
    timingLabel: pace.timingLabel,
    detailLabel: `${gramsPerCup}g 한 잔 기준`,
    hasCue: true,
  };
}
