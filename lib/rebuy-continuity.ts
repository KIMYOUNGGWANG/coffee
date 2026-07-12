export type RebuyContinuitySource = {
  readonly rebuy_sequence: number | null;
};

export type RebuyContinuity = {
  readonly purchaseDate: string | null;
  readonly rebuySequence: number;
};

function formatKoreanCalendarDate(now: Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

export function buildRebuyContinuity(
  source: RebuyContinuitySource | null,
  now: Date = new Date(),
): RebuyContinuity {
  if (!source) {
    return { purchaseDate: null, rebuySequence: 1 };
  }

  const sourceSequence = typeof source.rebuy_sequence === "number"
    && Number.isInteger(source.rebuy_sequence)
    && source.rebuy_sequence > 0
    ? source.rebuy_sequence
    : 1;

  return {
    purchaseDate: formatKoreanCalendarDate(now),
    rebuySequence: sourceSequence + 1,
  };
}
