"use client";

import { AlertCircle, CheckCircle, X } from "lucide-react";
import type { CheckoutItemType, CheckoutNotice } from "@/lib/checkout-return";

type CheckoutNoticeContent = {
  readonly tone: "success" | "cancel";
  readonly title: string;
  readonly description: string;
};

type DashboardCheckoutNoticeProps = {
  readonly notice: CheckoutNotice;
  readonly onDismiss: () => void;
};

const successNoticeContentByItemType = {
  pdf_book: {
    tone: "success",
    title: "PDF 테이스팅북 구매가 완료되었습니다",
    description: "프로필과 카드 정보를 새로 확인했어요. CoffeeDex Taste Passport 권한 반영을 준비했습니다.",
  },
  premium_subscription: {
    tone: "success",
    title: "CoffeeDex Premium 구독이 완료되었습니다",
    description: "프로필과 카드 정보를 새로 확인했어요. 프리미엄 혜택 상태를 대시보드에 반영했습니다.",
  },
  credits_10: {
    tone: "success",
    title: "CoffeeDex 테이스팅 10팩 충전이 완료되었습니다",
    description: "프로필과 카드 정보를 새로 확인했어요. 추가 AI 스캔 크레딧을 대시보드에 반영했습니다.",
  },
  checkout: {
    tone: "success",
    title: "결제가 완료되었습니다",
    description: "프로필과 카드 정보를 새로 확인했어요. 최신 구매 상태를 대시보드에 반영했습니다.",
  },
} satisfies Record<CheckoutItemType | "checkout", CheckoutNoticeContent>;

const cancelNoticeContent = {
  tone: "cancel",
  title: "결제가 취소되었습니다",
  description: "구독이나 PDF 권한은 변경되지 않았습니다. 필요하면 언제든 다시 선택할 수 있어요.",
} satisfies CheckoutNoticeContent;

export default function DashboardCheckoutNotice({ notice, onDismiss }: DashboardCheckoutNoticeProps) {
  const content = notice.status === "cancel"
    ? cancelNoticeContent
    : notice.itemType
      ? successNoticeContentByItemType[notice.itemType]
      : successNoticeContentByItemType.checkout;

  return (
    <section
      aria-label="체크아웃 상태"
      aria-live="polite"
      data-testid="checkout-return-notice"
      className={`mt-4 flex items-start gap-3 rounded-2xl border px-4 py-3 shadow-sm ${
        content.tone === "success"
          ? "border-emerald-200 bg-emerald-50 text-emerald-950"
          : "border-amber-200 bg-amber-50 text-amber-950"
      }`}
    >
      <div className="mt-0.5 shrink-0">
        {content.tone === "success" ? (
          <CheckCircle size={18} className="text-emerald-600" />
        ) : (
          <AlertCircle size={18} className="text-amber-600" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <h2 className="text-sm font-bold">{content.title}</h2>
        <p className="mt-1 text-xs leading-relaxed opacity-80">{content.description}</p>
      </div>
      <button
        type="button"
        aria-label="체크아웃 알림 닫기"
        onClick={onDismiss}
        className="rounded-full p-1 text-current/60 transition hover:bg-black/5 hover:text-current focus:outline-none focus:ring-2 focus:ring-current/30"
      >
        <X size={15} />
      </button>
    </section>
  );
}
