"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import { Loader2, Send } from "lucide-react";
import {
  supportCategoryLabels,
  supportRequestSchema,
  supportResponseSchema,
  type SupportCategory,
} from "@/lib/support";
import { useAnalyticsEvents } from "@/hooks/use-analytics-events";

type SupportFormStatus =
  | { readonly kind: "idle" }
  | { readonly kind: "submitting" }
  | { readonly kind: "success"; readonly ticketId: string }
  | { readonly kind: "error"; readonly message: string };

const supportCategoryOrder: readonly SupportCategory[] = [
  "payment_failed",
  "cancel_subscription",
  "refund_request",
  "account_help",
] as const;

function readFormString(formData: FormData, fieldName: string): string {
  const value = formData.get(fieldName);
  return typeof value === "string" ? value.trim() : "";
}

async function readJsonResponse(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch (error) {
    if (error instanceof Error) return {};
    throw error;
  }
}

export default function BillingSupportForm() {
  const { trackEvent } = useAnalyticsEvents();
  const [status, setStatus] = useState<SupportFormStatus>({ kind: "idle" });

  const submitSupportRequest = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const parsedPayload = supportRequestSchema.safeParse({
      email: readFormString(formData, "email"),
      category: readFormString(formData, "category"),
      message: readFormString(formData, "message"),
      checkoutSessionId: readFormString(formData, "checkoutSessionId") || undefined,
      subscriptionId: readFormString(formData, "subscriptionId") || undefined,
    });

    if (!parsedPayload.success) {
      setStatus({ kind: "error", message: "이메일과 문의 내용을 확인해주세요." });
      return;
    }

    trackEvent("billing_support_started", { surface: "support_page" });
    setStatus({ kind: "submitting" });
    const response = await fetch("/api/v1/support", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(parsedPayload.data),
    });
    const responseJson = await readJsonResponse(response);
    const parsedResponse = supportResponseSchema.safeParse(responseJson);

    if (!response.ok || !parsedResponse.success) {
      setStatus({ kind: "error", message: "문의 접수에 실패했습니다. 잠시 후 다시 시도해주세요." });
      return;
    }

    trackEvent("support_request_submitted", {
      category: parsedPayload.data.category,
      ticketId: parsedResponse.data.data.ticketId,
    });
    setStatus({ kind: "success", ticketId: parsedResponse.data.data.ticketId });
  };

  return (
    <form
      onSubmit={submitSupportRequest}
      className="rounded-3xl border border-warm-gray bg-white p-6 shadow-sm"
    >
      <div className="space-y-1">
        <p className="text-[11px] font-extrabold tracking-wide text-caramel">고객지원 접수</p>
        <h2 className="font-serif text-2xl font-bold">문의 접수</h2>
        <p className="text-xs leading-relaxed text-espresso/55">
          결제 기록 확인에 필요한 정보를 남겨주세요. 카드 전체 번호는 입력하지 마세요.
        </p>
      </div>

      <div className="mt-5 grid gap-4">
        <label className="grid gap-1.5 text-xs font-bold text-espresso/70">
          이메일
          <input
            name="email"
            type="email"
            required
            className="rounded-2xl border border-warm-gray bg-cream/40 px-3 py-2.5 text-sm text-espresso outline-none focus:border-caramel"
            placeholder="minji@example.com"
          />
        </label>

        <label className="grid gap-1.5 text-xs font-bold text-espresso/70">
          문의 유형
          <select
            name="category"
            className="rounded-2xl border border-warm-gray bg-cream/40 px-3 py-2.5 text-sm text-espresso outline-none focus:border-caramel"
          >
            {supportCategoryOrder.map((category) => (
              <option key={category} value={category}>
                {supportCategoryLabels[category]}
              </option>
            ))}
          </select>
        </label>

        <label className="grid gap-1.5 text-xs font-bold text-espresso/70">
          문의 내용
          <textarea
            name="message"
            required
            minLength={10}
            className="min-h-32 rounded-2xl border border-warm-gray bg-cream/40 px-3 py-2.5 text-sm text-espresso outline-none focus:border-caramel"
            placeholder="결제 실패 화면, 구독 취소 희망일, 환불 요청 사유를 적어주세요."
          />
        </label>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <label className="grid gap-1.5 text-xs font-bold text-espresso/70">
            체크아웃 세션 ID <span className="font-medium text-espresso/45">선택</span>
            <input
              name="checkoutSessionId"
              className="rounded-2xl border border-warm-gray bg-cream/40 px-3 py-2.5 text-sm outline-none focus:border-caramel"
              placeholder="cs_test_..."
            />
          </label>
          <label className="grid gap-1.5 text-xs font-bold text-espresso/70">
            구독 ID <span className="font-medium text-espresso/45">선택</span>
            <input
              name="subscriptionId"
              className="rounded-2xl border border-warm-gray bg-cream/40 px-3 py-2.5 text-sm outline-none focus:border-caramel"
              placeholder="sub_..."
            />
          </label>
        </div>
        <p className="rounded-2xl border border-caramel/15 bg-caramel/10 px-3 py-2 text-xs leading-relaxed text-espresso/60">
          <span className="font-extrabold text-espresso/75">Stripe ID는 선택 입력입니다.</span> 영수증의 cs_ 또는 sub_ 값을 남기면 영업일 1일 내 확인이 빨라집니다.
        </p>
      </div>

      {status.kind === "success" && (
        <p className="mt-4 rounded-2xl border border-caramel/25 bg-caramel/10 px-4 py-3 text-sm font-bold text-espresso">
          접수번호 {status.ticketId}
        </p>
      )}
      {status.kind === "error" && (
        <p className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
          {status.message}
        </p>
      )}

      <button
        type="submit"
        disabled={status.kind === "submitting"}
        className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-espresso px-4 py-3 text-sm font-extrabold text-white transition-all hover:bg-espresso/90 disabled:opacity-60"
      >
        {status.kind === "submitting" ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
        문의 접수
      </button>
    </form>
  );
}
