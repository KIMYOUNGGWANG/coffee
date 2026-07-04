import { readPurchaseBagWeight } from "./rebuy-purchase-memory";

export type RebuyShelfTransferCard = {
  readonly id: string;
  readonly title: string;
  readonly subtitle: string;
  readonly package_origin: string | null;
  readonly purchase_url: string | null;
  readonly purchase_note: string | null;
  readonly repurchase_intent: "again" | "maybe" | "no" | "undecided";
  readonly footer_meta?: {
    readonly origin?: string;
  };
};

export type RebuyShelfTransferPayload = {
  readonly roasterName: string;
  readonly beanName: string;
  readonly origin: string | null;
  readonly roastDate: null;
  readonly openedDate: null;
  readonly totalWeight: number;
  readonly fillLevel: 100;
  readonly tastingCardId: string | null;
  readonly purchaseUrl: string | null;
  readonly purchaseNote: string | null;
  readonly rebuyPriority: "normal";
  readonly rebuyAction: "rebought";
  readonly rating: 5 | null;
  readonly wantAgain: true;
};

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
function isNonBlank(value: string | null | undefined): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function normalize(value: string | null | undefined): string | null {
  if (!isNonBlank(value)) return null;
  return value.trim();
}

export function buildRebuyShelfTransferPayload(card: RebuyShelfTransferCard): RebuyShelfTransferPayload {
  return {
    roasterName: normalize(card.subtitle) ?? "기록한 로스터리",
    beanName: normalize(card.title) ?? "다시 산 원두",
    origin: normalize(card.package_origin) ?? normalize(card.footer_meta?.origin),
    roastDate: null,
    openedDate: null,
    totalWeight: readPurchaseBagWeight(card.purchase_note) ?? 200,
    fillLevel: 100,
    tastingCardId: UUID_PATTERN.test(card.id) ? card.id : null,
    purchaseUrl: normalize(card.purchase_url),
    purchaseNote: normalize(card.purchase_note),
    rebuyPriority: "normal",
    rebuyAction: "rebought",
    rating: card.repurchase_intent === "again" ? 5 : null,
    wantAgain: true,
  };
}
