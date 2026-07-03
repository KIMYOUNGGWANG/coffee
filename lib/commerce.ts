import { z } from "zod";

export const checkoutItemTypeSchema = z.enum(["premium_subscription", "credits_10", "pdf_book"]);

export type CheckoutProductItemType = z.infer<typeof checkoutItemTypeSchema>;
export type CheckoutMode = "payment" | "subscription";

export type CheckoutProduct = {
  readonly itemType: CheckoutProductItemType;
  readonly name: string;
  readonly shortName: string;
  readonly description: string;
  readonly amountCents: number;
  readonly displayPrice: string;
  readonly cadence: string;
  readonly mode: CheckoutMode;
  readonly ctaLabel: string;
  readonly dialogCtaLabel: string;
  readonly benefits: readonly string[];
};

export const checkoutProductCatalog = {
  premium_subscription: {
    itemType: "premium_subscription",
    name: "CoffeeDex Premium 구독 (월간)",
    shortName: "Premium",
    description: "월간 한도 없는 원두 패키지 사진 판독과 기록 기반 취향 리포트",
    amountCents: 399,
    displayPrice: "$3.99",
    cadence: "월간 구독",
    mode: "subscription",
    ctaLabel: "Premium으로 시작",
    dialogCtaLabel: "구독하기",
    benefits: [
      "월간 라벨 사진 판독 한도 해제",
      "기록 기반 취향 리포트",
      "구독 취소 후 현재 결제 기간까지 이용",
    ],
  },
  credits_10: {
    itemType: "credits_10",
    name: "CoffeeDex 테이스팅 10팩 충전",
    shortName: "Scan 10 Pack",
    description: "무료 월간 스캔을 모두 사용한 뒤 원두 패키지 사진 10장을 추가 분석",
    amountCents: 499,
    displayPrice: "$4.99",
    cadence: "일회성 충전",
    mode: "payment",
    ctaLabel: "스캔 10팩 충전",
    dialogCtaLabel: "충전하기",
    benefits: [
      "원두 패키지 사진 10장 추가 분석",
      "Premium 없이 필요한 만큼만 충전",
      "사용하지 않은 크레딧은 계정에 보관",
    ],
  },
  pdf_book: {
    itemType: "pdf_book",
    name: "홈카페 테이스팅북 PDF",
    shortName: "PDF Book",
    description: "내가 수집한 카드와 취향 분석을 묶은 디지털 홈카페 기록북",
    amountCents: 999,
    displayPrice: "$9.99",
    cadence: "일회성 구매",
    mode: "payment",
    ctaLabel: "PDF 기록북 구매",
    dialogCtaLabel: "구매하기",
    benefits: [
      "저장한 카드 기반 PDF 기록북",
      "디지털 파일로 개인 소장",
      "결제 후 대시보드에서 다운로드",
    ],
  },
} satisfies Record<CheckoutProductItemType, CheckoutProduct>;

export const checkoutProductOrder: readonly CheckoutProductItemType[] = [
  "premium_subscription",
  "credits_10",
  "pdf_book",
] as const;

export function readCheckoutProduct(itemType: CheckoutProductItemType): CheckoutProduct {
  return checkoutProductCatalog[itemType];
}
