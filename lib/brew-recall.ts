const BREW_METADATA_PATTERNS = [
  /\b(?:v60|hario|kalita|chemex|aeropress|espresso|french press|clever|origami|dripper|pour[\s-]?over)\b|(?:핸드드립|에스프레소|콜드브루)/i,
  /(?:\d{1,2}(?:\.\d+)?\s*g\s*[:/]\s*\d{2,4}(?:\.\d+)?\s*g)|(?:\b1\s*:\s*\d{1,2}(?:\.\d+)?\b)/i,
  /\b\d{2,3}\s*(?:°\s*)?[cC]\b/i,
  /\b\d{1,3}(?:\.\d+)?\s*g\b/i,
  /\b\d{1,2}:\d{2}\b/,
] as const;

export function hasBrewRecallMetadata(extraInfo: string | null | undefined): boolean {
  const normalizedInfo = extraInfo?.trim();
  if (!normalizedInfo) return false;

  const matchedSignalCount = BREW_METADATA_PATTERNS.filter((pattern) =>
    pattern.test(normalizedInfo),
  ).length;
  return matchedSignalCount >= 2;
}

export function getBrewRecallSummary(extraInfo: string | null | undefined): string | null {
  const normalizedInfo = extraInfo?.trim();
  if (!normalizedInfo || !hasBrewRecallMetadata(normalizedInfo)) return null;
  return normalizedInfo;
}
