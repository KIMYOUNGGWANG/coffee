export type RebuyPurchaseMemory = {
  readonly priceLabel: string | null;
  readonly bagSizeLabel: string | null;
  readonly placeLabel: string | null;
  readonly summaryLabels: readonly string[];
  readonly hasStructuredMemory: boolean;
};

const WEIGHT_PATTERN = /(\d+(?:\.\d+)?)\s?(kg|킬로|g|그램|그람)/i;
const MANWON_PRICE_PATTERN = /(\d+(?:\.\d+)?)\s?만\s?원/;
const CHEONWON_PRICE_PATTERN = /(\d+(?:\.\d+)?)\s?천\s?원/;
const WON_PRICE_PATTERN = /(?:₩|KRW\s*)?\s?(\d{1,3}(?:[, ]\d{3})+|\d{4,6})\s?원?/i;

function isNonBlank(value: string | null | undefined): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function formatWon(value: number): string {
  return `${Math.round(value).toLocaleString("ko-KR")}원`;
}

export function readPurchaseBagWeight(purchaseNote: string | null): number | null {
  const match = purchaseNote?.match(WEIGHT_PATTERN);
  if (!match) return null;

  const amount = Number.parseFloat(match[1] ?? "");
  const unit = match[2]?.toLowerCase();
  const grams = unit === "kg" || unit === "킬로" ? amount * 1000 : amount;
  if (!Number.isFinite(grams)) return null;
  return Math.round(Math.min(1000, Math.max(50, grams)));
}

function readBagSizeLabel(purchaseNote: string | null): string | null {
  const grams = readPurchaseBagWeight(purchaseNote);
  if (!grams) return null;
  return grams >= 1000 ? `${grams / 1000}kg` : `${grams}g`;
}

function readPriceLabel(purchaseNote: string | null): string | null {
  if (!purchaseNote) return null;

  const manwon = purchaseNote.match(MANWON_PRICE_PATTERN);
  if (manwon) {
    const amount = Number.parseFloat(manwon[1] ?? "");
    return Number.isFinite(amount) ? formatWon(amount * 10000) : null;
  }

  const cheonwon = purchaseNote.match(CHEONWON_PRICE_PATTERN);
  if (cheonwon) {
    const amount = Number.parseFloat(cheonwon[1] ?? "");
    return Number.isFinite(amount) ? formatWon(amount * 1000) : null;
  }

  const won = purchaseNote.match(WON_PRICE_PATTERN);
  if (!won) return null;

  const amount = Number.parseInt((won[1] ?? "").replace(/[, ]/g, ""), 10);
  if (!Number.isFinite(amount)) return null;
  return formatWon(amount);
}

function readPlaceLabel(purchaseNote: string | null): string | null {
  if (!purchaseNote) return null;

  const cleaned = purchaseNote
    .replace(MANWON_PRICE_PATTERN, " ")
    .replace(CHEONWON_PRICE_PATTERN, " ")
    .replace(WON_PRICE_PATTERN, " ")
    .replace(WEIGHT_PATTERN, " ")
    .replace(/옵션|원두|봉지|백|bag/gi, " ")
    .replace(/[·,/|()]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (!isNonBlank(cleaned)) return null;
  return cleaned.split(/\s+/).slice(0, 3).join(" ");
}

export function buildRebuyPurchaseMemory(purchaseNote: string | null): RebuyPurchaseMemory {
  const placeLabel = readPlaceLabel(purchaseNote);
  const priceLabel = readPriceLabel(purchaseNote);
  const bagSizeLabel = readBagSizeLabel(purchaseNote);
  const summaryLabels = [
    placeLabel ? `구매처 ${placeLabel}` : null,
    priceLabel ? `가격 ${priceLabel}` : null,
    bagSizeLabel ? `용량 ${bagSizeLabel}` : null,
  ].filter(isNonBlank);

  return {
    priceLabel,
    bagSizeLabel,
    placeLabel,
    summaryLabels,
    hasStructuredMemory: summaryLabels.length > 0,
  };
}
