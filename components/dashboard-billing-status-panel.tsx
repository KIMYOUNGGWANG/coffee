"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, CheckCircle2, RefreshCw } from "lucide-react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { useAnalyticsEvents } from "@/hooks/use-analytics-events";

type DashboardBillingStatusPanelProps = {
  readonly onOpenPayment: () => void;
};

const subscriptionSummarySchema = z.object({
  plan: z.enum(["free", "premium"]),
  status: z.enum([
    "inactive",
    "incomplete",
    "incomplete_expired",
    "trialing",
    "active",
    "past_due",
    "canceled",
    "unpaid",
    "paused",
  ]),
  isPremium: z.boolean(),
  stripeSubscriptionId: z.string().nullable(),
  currentPeriodEnd: z.string().nullable(),
  cancelAtPeriodEnd: z.boolean(),
  lastInvoiceStatus: z.string().nullable(),
  updatedAt: z.string().nullable(),
});
const subscriptionResponseSchema = z.object({ data: subscriptionSummarySchema });

type SubscriptionSummary = z.infer<typeof subscriptionSummarySchema>;

async function readJsonResponse(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch (error) {
    if (error instanceof Error) return {};
    throw error;
  }
}

async function fetchSubscriptionSummary(): Promise<SubscriptionSummary> {
  const response = await fetch("/api/v1/subscription");
  const json = await readJsonResponse(response);
  const parsedResponse = subscriptionResponseSchema.safeParse(json);

  if (!response.ok || !parsedResponse.success) {
    throw new Error("구독 상태를 불러오지 못했습니다.");
  }
  return parsedResponse.data.data;
}

function statusTitle(subscription: SubscriptionSummary): string {
  if (subscription.status === "past_due" || subscription.status === "unpaid") return "결제 실패 복구 필요";
  if (subscription.cancelAtPeriodEnd) return "구독 취소 예약됨";
  if (subscription.status === "canceled") return "구독 취소 상태";
  if (subscription.isPremium) return "Premium 활성";
  return "무료 플랜";
}

function statusCopy(subscription: SubscriptionSummary): string {
  if (subscription.status === "past_due" || subscription.status === "unpaid") {
    return "최근 결제가 실패해 Premium 권한이 제한될 수 있습니다. 결제를 다시 시도하거나 고객지원으로 문의하세요.";
  }
  if (subscription.cancelAtPeriodEnd) {
    return "현재 결제 기간이 끝날 때 Premium 구독이 종료됩니다. 필요하면 고객지원에서 취소 상태를 확인할 수 있습니다.";
  }
  if (subscription.status === "canceled") {
    return "Premium 구독이 취소되었습니다. 환불 요청 또는 재구독 문의가 필요하면 고객지원으로 이동하세요.";
  }
  if (subscription.isPremium) return "월간 스캔과 취향 리포트가 활성화되어 있습니다.";
  return "무료 스캔과 저장 기능으로 시작하고, 필요할 때 Premium 또는 크레딧을 결제하세요.";
}

function planLabel(plan: SubscriptionSummary["plan"]): string {
  switch (plan) {
    case "premium":
      return "Premium";
    case "free":
      return "무료";
  }
}

function formatBillingDate(value: string | null): string {
  if (!value) return "없음";
  const parsedDate = new Date(value);
  if (Number.isNaN(parsedDate.getTime())) return "확인 필요";
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  }).format(parsedDate);
}

function invoiceStatusLabel(lastInvoiceStatus: string | null): string {
  switch (lastInvoiceStatus) {
    case "paid":
      return "결제 완료";
    case "open":
      return "결제 대기";
    case "void":
      return "무효 처리";
    case "uncollectible":
      return "회수 불가";
    case null:
      return "없음";
    default:
      return lastInvoiceStatus;
  }
}

export default function DashboardBillingStatusPanel({ onOpenPayment }: DashboardBillingStatusPanelProps) {
  const { trackEvent } = useAnalyticsEvents();
  const { data: subscription, isLoading, error } = useQuery({
    queryKey: ["subscription-status"],
    queryFn: fetchSubscriptionSummary,
  });

  useEffect(() => {
    if (!subscription) return;
    trackEvent("subscription_status_viewed", {
      status: subscription.status,
      plan: subscription.plan,
      cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
      currentPeriodEnd: subscription.currentPeriodEnd,
    });
  }, [subscription, trackEvent]);

  if (isLoading) {
    return (
      <div className="rounded-3xl border border-white/10 glass-card p-5 text-xs text-muted-foreground/80">
        구독 상태 확인 중...
      </div>
    );
  }

  if (error || !subscription) {
    return (
      <div className="rounded-3xl border border-white/10 glass-card p-5 text-xs text-muted-foreground/80">
        구독 상태를 불러오지 못했습니다.
      </div>
    );
  }

  const isPaymentProblem = subscription.status === "past_due" || subscription.status === "unpaid";
  const isCanceled = subscription.status === "canceled" || subscription.cancelAtPeriodEnd;

  return (
    <div className="rounded-3xl border border-white/10 glass-card p-5 shadow-sm">
      <div className="flex items-center gap-2">
        {isPaymentProblem ? (
          <AlertTriangle size={16} className="text-red-600" />
        ) : (
          <CheckCircle2 size={16} className="text-primary-amber" />
        )}
        <span className="text-[11px] font-extrabold tracking-wide text-primary-amber">결제 상태</span>
      </div>
      <h3 className="mt-2 font-serif text-base font-bold">{statusTitle(subscription)}</h3>
      <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{statusCopy(subscription)}</p>
      <div className="mt-4 grid grid-cols-1 gap-2 rounded-2xl border border-white/10 bg-white/5/40 p-3 text-xs text-muted-foreground">
        <p>
          플랜 <span className="font-extrabold text-foreground">{planLabel(subscription.plan)}</span>
        </p>
        <p>
          현재 기간 종료{" "}
          <span className="font-extrabold text-foreground">
            {formatBillingDate(subscription.currentPeriodEnd)}
          </span>
        </p>
        <p>
          최근 청구서 <span className="font-extrabold text-foreground">{invoiceStatusLabel(subscription.lastInvoiceStatus)}</span>
        </p>
        <p>
          취소 예약 <span className="font-extrabold text-foreground">{subscription.cancelAtPeriodEnd ? "예" : "아니오"}</span>
        </p>
        <p>
          마지막 동기화 <span className="font-extrabold text-foreground">{formatBillingDate(subscription.updatedAt)}</span>
        </p>
      </div>
      <div className="mt-4 flex flex-col gap-2">
        {isPaymentProblem && (
          <Button onClick={onOpenPayment} className="rounded-xl glass-card border border-white/10 text-xs font-bold text-white hover:glass-card border border-white/10/90">
            <RefreshCw size={13} />
            결제 다시 시도
          </Button>
        )}
        {isCanceled && (
          <Link href="/support/billing" className="rounded-xl border border-white/10 px-3 py-2 text-center text-xs font-bold text-primary-amber">
            구독 취소 / 환불 요청
          </Link>
        )}
        {!isPaymentProblem && !isCanceled && (
          <Link href="/support/billing" className="rounded-xl border border-white/10 px-3 py-2 text-center text-xs font-bold text-primary-amber">
            결제·환불 고객지원
          </Link>
        )}
      </div>
    </div>
  );
}
