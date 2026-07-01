export type ShelfConsumptionInput = {
  readonly totalWeight: number | null | undefined;
  readonly fillLevel: number | null | undefined;
  readonly coffeeAmount: number | null | undefined;
};

export type ShelfConsumptionResult = {
  readonly consumedGrams: number;
  readonly consumedPercent: number;
  readonly previousFillLevel: number;
  readonly nextFillLevel: number;
  readonly remainingGrams: number;
  readonly isFinished: boolean;
};

function clampPercentage(value: number) {
  return Math.min(100, Math.max(0, value));
}

function isPositiveFiniteNumber(value: number | null | undefined): value is number {
  return typeof value === "number" && Number.isFinite(value) && value > 0;
}

export function calculateShelfConsumption(input: ShelfConsumptionInput): ShelfConsumptionResult | null {
  const { totalWeight, fillLevel, coffeeAmount } = input;

  if (!isPositiveFiniteNumber(totalWeight) || !isPositiveFiniteNumber(coffeeAmount)) {
    return null;
  }

  if (typeof fillLevel !== "number" || !Number.isFinite(fillLevel)) {
    return null;
  }

  const previousFillLevel = Math.round(clampPercentage(fillLevel));
  const currentGrams = totalWeight * (previousFillLevel / 100);
  const remainingGrams = Math.max(0, currentGrams - coffeeAmount);
  const nextFillLevel = Math.round(clampPercentage((remainingGrams / totalWeight) * 100));
  const consumedPercent = Math.min(100, Math.max(1, Math.round((coffeeAmount / totalWeight) * 100)));

  return {
    consumedGrams: Number(coffeeAmount.toFixed(1)),
    consumedPercent,
    previousFillLevel,
    nextFillLevel,
    remainingGrams: Number(remainingGrams.toFixed(1)),
    isFinished: nextFillLevel === 0,
  };
}
