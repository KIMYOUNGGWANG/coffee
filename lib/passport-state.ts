export type ConfirmedCoffeeMemory = {
  readonly origin: string | null;
  readonly process: string | null;
  readonly tags: readonly string[];
};

export type PassportCoverage = "narrow" | "mixed" | "broad";

type PassportEvidence = {
  readonly sampleCount: number;
  readonly distinctOriginCount: number;
  readonly distinctProcessCount: number;
  readonly distinctTagCount: number;
  readonly coverage: PassportCoverage;
};

export type PassportState = PassportEvidence & (
  | { readonly kind: "empty" }
  | { readonly kind: "collage" }
  | { readonly kind: "first_signals" }
  | { readonly kind: "early_snapshot" }
  | { readonly kind: "current_snapshot" }
);

type PassportKind = PassportState["kind"];

function distinctPresentValues(values: readonly (string | null)[]): Set<string> {
  return new Set(values.filter((value): value is string => value !== null));
}

function passportKind(sampleCount: number): PassportKind {
  if (sampleCount === 0) return "empty";
  if (sampleCount <= 2) return "collage";
  if (sampleCount <= 4) return "first_signals";
  if (sampleCount <= 9) return "early_snapshot";
  return "current_snapshot";
}

function passportCoverage(
  distinctOriginCount: number,
  distinctProcessCount: number,
  distinctTagCount: number,
): PassportCoverage {
  const counts = [distinctOriginCount, distinctProcessCount, distinctTagCount];
  if (counts.some((count) => count === 0) || counts.every((count) => count === 1)) {
    return "narrow";
  }
  if (counts.every((count) => count >= 3)) return "broad";
  return "mixed";
}

function assertNever(value: never): never {
  return value;
}

export function buildPassportState(
  confirmedMemories: readonly ConfirmedCoffeeMemory[],
): PassportState {
  const distinctOriginCount = distinctPresentValues(
    confirmedMemories.map((memory) => memory.origin),
  ).size;
  const distinctProcessCount = distinctPresentValues(
    confirmedMemories.map((memory) => memory.process),
  ).size;
  const distinctTagCount = new Set(confirmedMemories.flatMap((memory) => memory.tags)).size;
  const evidence: PassportEvidence = {
    sampleCount: confirmedMemories.length,
    distinctOriginCount,
    distinctProcessCount,
    distinctTagCount,
    coverage: passportCoverage(distinctOriginCount, distinctProcessCount, distinctTagCount),
  };
  const kind = passportKind(evidence.sampleCount);

  switch (kind) {
    case "empty":
      return { kind, ...evidence };
    case "collage":
      return { kind, ...evidence };
    case "first_signals":
      return { kind, ...evidence };
    case "early_snapshot":
      return { kind, ...evidence };
    case "current_snapshot":
      return { kind, ...evidence };
    default:
      return assertNever(kind);
  }
}
