"use client";

import { useEffect, useState } from "react";
import { X, Sparkles, BookOpen, Loader2, ArrowRight, Camera } from "lucide-react";
import { z } from "zod";
import { useAnalyticsEvents } from "@/hooks/use-analytics-events";
import { buildAuthGateHref, isAuthRequiredError } from "@/lib/auth-redirect";
import { checkoutProductCatalog } from "@/lib/commerce";
import { buildDashboardCheckoutIntentHref, type CheckoutItemType } from "@/lib/checkout-return";

const checkoutResponseSchema = z.object({
  url: z.string().url().optional(),
  error: z.object({ message: z.string().optional() }).optional(),
});

type CheckoutResponse = z.infer<typeof checkoutResponseSchema>;

type PaymentDialogProps = {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly resumeItemType?: CheckoutItemType | null;
};

function readCheckoutFailureMessage(responseData: CheckoutResponse | null): string {
  const message = responseData?.error?.message?.trim();
  if (message) {
    return message;
  }

  return "결제 세션을 시작하지 못했습니다. 잠시 후 다시 시도해 주세요.";
}

function itemLabel(itemType: CheckoutItemType): string {
  return checkoutProductCatalog[itemType].name;
}

export default function PaymentDialog({ isOpen, onClose, resumeItemType = null }: PaymentDialogProps) {
  const [loadingItem, setLoadingItem] = useState<CheckoutItemType | null>(null);
  const [checkoutErrorMessage, setCheckoutErrorMessage] = useState<string | null>(null);
  const { trackEvent } = useAnalyticsEvents();
  const premiumProduct = checkoutProductCatalog.premium_subscription;
  const creditsProduct = checkoutProductCatalog.credits_10;
  const pdfProduct = checkoutProductCatalog.pdf_book;

  useEffect(() => {
    if (!isOpen) {
      setCheckoutErrorMessage(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCheckout = async (itemType: CheckoutItemType) => {
    setLoadingItem(itemType);
    setCheckoutErrorMessage(null);
    trackEvent("checkout_started", { itemType });
    try {
      const response = await fetch("/api/v1/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemType }),
      });

      const responseData: unknown = await response.json();
      const parsedData = checkoutResponseSchema.safeParse(responseData);
      const parsedResponseData = parsedData.success ? parsedData.data : null;
      const errorMessage = parsedResponseData?.error?.message ?? null;
      if (!response.ok && (response.status === 401 || isAuthRequiredError(errorMessage))) {
        trackEvent("checkout_failed", { itemType, reason: "auth_required" });
        window.location.href = buildAuthGateHref(buildDashboardCheckoutIntentHref(itemType));
        return;
      }

      if (response.ok && parsedResponseData?.url) {
        window.location.href = parsedResponseData.url;
      } else {
        trackEvent("checkout_failed", { itemType, reason: "session_creation_failed" });
        setCheckoutErrorMessage(readCheckoutFailureMessage(parsedResponseData));
      }
    } catch (error) {
      if (error instanceof Error) {
        console.error("Stripe redirect failed:", error.message);
      } else {
        console.error("Stripe redirect failed:", error);
      }
      trackEvent("checkout_failed", { itemType, reason: "network_error" });
      setCheckoutErrorMessage("네트워크 통신 중 오류가 발생했습니다. 연결을 확인한 뒤 다시 시도해 주세요.");
    } finally {
      setLoadingItem(null);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-start justify-center overflow-y-auto p-4 sm:items-center">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="payment-dialog-title"
        className="glass-card border border-white/10 rounded-3xl w-full max-w-xl max-h-[calc(100dvh-2rem)] shadow-2xl overflow-x-hidden overflow-y-auto animate-in fade-in zoom-in-95 duration-200 text-foreground"
      >

        <div className="bg-gradient-to-r from-black/80 to-primary-amber/20 text-foreground p-6 relative">
          <button
            type="button"
            onClick={onClose}
            aria-label="결제 창 닫기"
            className="absolute top-4 right-4 p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-muted-foreground hover:text-foreground transition-colors"
          >
            <X size={16} />
          </button>

          <span className="text-[9px] uppercase font-bold tracking-widest text-primary-amber bg-white/10 px-2.5 py-0.5 rounded-full inline-block">
            CoffeeDex 선택 기능
          </span>
          <h2 id="payment-dialog-title" className="text-xl font-serif font-bold text-foreground mt-2 flex items-center gap-1.5">
            <Sparkles size={18} className="text-foreground" />
            추가 기능 및 결제
          </h2>
          <p className="text-xs text-foreground/70 mt-1 leading-relaxed">
            기록과 다시 찾기는 그대로 이용하고, 필요한 스캔·구독·PDF 기능만 선택하세요.
          </p>
          {resumeItemType && (
            <p className="mt-3 rounded-xl border border-white/20 bg-white/10 px-3 py-2 text-xs font-bold text-foreground">
              로그인 후 이어서 결제할 상품: {itemLabel(resumeItemType)}
            </p>
          )}
        </div>

        <div className="p-6 space-y-4 bg-black/40">
          {checkoutErrorMessage && (
            <div role="alert" className="rounded-2xl border border-primary-amber/30 bg-white/5 px-4 py-3 text-left shadow-sm">
              <p className="text-xs font-extrabold text-primary-amber">CoffeeDex 결제 연결을 열지 못했어요.</p>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                {checkoutErrorMessage}
              </p>
              <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">
                상품 버튼을 다시 누르면 새 Stripe 결제창을 요청합니다. 문제가 계속되면 잠시 뒤 다시 시도해 주세요.
              </p>
            </div>
          )}

          <div className={`bg-white/5 border border-white/10 rounded-2xl p-4 flex justify-between items-center hover:border-primary-amber/60 hover:shadow-sm transition-all group relative overflow-hidden ${
            resumeItemType === "premium_subscription" ? "border-primary-amber shadow-sm" : "border-white/10"
          }`}>
            <div className="absolute top-0 right-0 bg-primary-amber text-foreground text-[8px] uppercase font-extrabold px-2 py-0.5 rounded-bl-xl">
              POPULAR
            </div>
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/10 flex items-center justify-center text-primary-amber shrink-0 mt-0.5">
                <Sparkles size={18} />
              </div>
              <div>
                <h4 className="text-sm font-bold">{premiumProduct.name}</h4>
                <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
                  {premiumProduct.description}
                </p>
              </div>
            </div>
            <div className="text-right shrink-0">
              <span className="text-base font-bold text-foreground block">{premiumProduct.displayPrice}</span>
              <button
                type="button"
                disabled={loadingItem !== null}
                onClick={() => handleCheckout("premium_subscription")}
                className="mt-1 text-[11px] font-bold text-primary-amber hover:underline flex items-center gap-0.5 cursor-pointer"
              >
                {loadingItem === "premium_subscription" ? (
                  <Loader2 size={12} className="animate-spin text-primary-amber" />
                ) : (
                  <>
                    {premiumProduct.dialogCtaLabel} <ArrowRight size={10} />
                  </>
                )}
              </button>
            </div>
          </div>

          <div className={`bg-white/5 border border-white/10 rounded-2xl p-4 flex justify-between items-center hover:border-primary-amber/40 hover:shadow-sm transition-all group ${
            resumeItemType === "credits_10" ? "border-primary-amber shadow-sm" : "border-white/10"
          }`}>
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/10 flex items-center justify-center text-primary-amber shrink-0 mt-0.5">
                <Camera size={18} />
              </div>
              <div>
                <h4 className="text-sm font-bold">{creditsProduct.name}</h4>
                <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
                  {creditsProduct.description}
                </p>
              </div>
            </div>
            <div className="text-right shrink-0">
              <span className="text-base font-bold text-foreground block">{creditsProduct.displayPrice}</span>
              <button
                type="button"
                disabled={loadingItem !== null}
                onClick={() => handleCheckout("credits_10")}
                className="mt-1 text-[11px] font-bold text-primary-amber hover:underline flex items-center gap-0.5 cursor-pointer"
              >
                {loadingItem === "credits_10" ? (
                  <Loader2 size={12} className="animate-spin text-primary-amber" />
                ) : (
                  <>
                    {creditsProduct.dialogCtaLabel} <ArrowRight size={10} />
                  </>
                )}
              </button>
            </div>
          </div>

          <div className={`bg-white/5 border border-white/10 rounded-2xl p-4 flex justify-between items-center hover:border-primary-amber/40 hover:shadow-sm transition-all group ${
            resumeItemType === "pdf_book" ? "border-primary-amber shadow-sm" : "border-white/10"
          }`}>
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/10 flex items-center justify-center text-primary-amber shrink-0 mt-0.5">
                <BookOpen size={18} />
              </div>
              <div>
                <h4 className="text-sm font-bold">{pdfProduct.name}</h4>
                <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
                  {pdfProduct.description}
                </p>
              </div>
            </div>
            <div className="text-right shrink-0">
              <span className="text-base font-bold text-foreground block">{pdfProduct.displayPrice}</span>
              <button
                type="button"
                disabled={loadingItem !== null}
                onClick={() => handleCheckout("pdf_book")}
                className="mt-1 text-[11px] font-bold text-primary-amber hover:underline flex items-center gap-0.5 cursor-pointer"
              >
                {loadingItem === "pdf_book" ? (
                  <Loader2 size={12} className="animate-spin text-primary-amber" />
                ) : (
                  <>
                    {pdfProduct.dialogCtaLabel} <ArrowRight size={10} />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-white/10 bg-transparent text-center text-[10px] text-muted-foreground space-x-2">
          <span>Stripe 암호화 결제 시스템을 이용하며 카드 정보는 안전하게 보호됩니다.</span>
          <a className="font-bold text-primary-amber" href="/legal/payment">결제 및 환불 고지</a>
          <a className="font-bold text-primary-amber" href="/support/billing">고객지원</a>
        </div>
      </div>
    </div>
  );
}
