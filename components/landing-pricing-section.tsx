"use client";

import Link from "next/link";
import { useEffect } from "react";
import { ArrowRight, BookOpen, CheckCircle2, ChevronDown, Sparkles } from "lucide-react";
import { checkoutProductCatalog, checkoutProductOrder, type CheckoutProductItemType } from "@/lib/commerce";
import { useAnalyticsEvents } from "@/hooks/use-analytics-events";

const pricingLabelByItemType = {
  premium_subscription: "월간 Premium",
  credits_10: "스캔 10팩",
  pdf_book: "PDF 기록북",
} satisfies Record<CheckoutProductItemType, string>;

const productDeckLabel = {
  premium_subscription: "subscription / taste map",
  credits_10: "scan credits / label reader",
  pdf_book: "artifact / home archive",
} satisfies Record<CheckoutProductItemType, string>;

function checkoutHref(itemType: CheckoutProductItemType): string {
  switch (itemType) {
    case "premium_subscription":
      return "/dashboard?checkout_intent=premium_subscription";
    case "credits_10":
      return "/dashboard?checkout_intent=credits_10";
    case "pdf_book":
      return "/dashboard?checkout_intent=pdf_book";
  }
}

export default function LandingPricingSection() {
  const { trackEvent } = useAnalyticsEvents();

  useEffect(() => {
    trackEvent("landing_view");
    trackEvent("pricing_viewed", { surface: "landing" });
  }, [trackEvent]);

  const premiumProduct = checkoutProductCatalog.premium_subscription;
  const secondaryProducts = checkoutProductOrder.filter((itemType) => itemType !== "premium_subscription");

  return (
    <section
      data-testid="landing-pricing-section"
      className="border-y border-white/10 bg-black/20 py-8"
    >
      <details className="group mx-auto max-w-7xl px-4 md:px-8">
        <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-4 text-left marker:content-none">
          <span>
            <span className="block text-xs font-black text-foreground">추가 기능 및 가격 안내</span>
            <span className="mt-1 block text-xs text-muted-foreground">더 많은 스캔, PDF 기록북, Premium은 필요할 때 선택할 수 있습니다.</span>
          </span>
          <ChevronDown size={18} className="shrink-0 text-primary-amber transition-transform group-open:rotate-180" />
        </summary>
        <div className="mt-8 grid grid-cols-1 gap-10 lg:grid-cols-[0.82fr_1.18fr]">
        <div className="lg:sticky lg:top-8 lg:self-start">
          <span className="issue-marker inline-flex items-center gap-2 text-[11px] font-black tracking-wide text-muted-foreground">
            선택 기능
          </span>
          <h2 className="mt-5 break-keep font-serif text-3xl font-black leading-tight text-foreground md:text-5xl">
            가격은 기능표가 아니라
            <span className="block text-primary-amber">기록물의 단계입니다.</span>
          </h2>
          <p className="mt-5 max-w-lg text-sm font-semibold leading-7 text-muted-foreground">
            무료 Taste Card로 시작하고, 더 많은 스캔과 리캡이 필요할 때 Premium으로 확장합니다. PDF는 쌓인 기록을
            보관 가능한 디지털 기록북으로 꺼내는 별도 결과물입니다.
          </p>
          <Link href="/legal/payment" className="mt-7 inline-flex border-b border-white/10 text-xs font-black text-foreground transition hover:text-primary-amber">
            결제 및 환불 고지
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-4">
          <article className="relative overflow-hidden border border-white/10 glass-card border border-white/10 text-foreground p-6 shadow-[10px_10px_0_rgba(47,37,31,0.15)] md:p-8">
            <div className="absolute right-5 top-5 hidden text-[9rem] font-black leading-none text-white/5 md:block">01</div>
            <div className="relative z-10 grid grid-cols-1 gap-8 md:grid-cols-[1fr_0.72fr]">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-primary-amber">
                  {pricingLabelByItemType[premiumProduct.itemType]} · {productDeckLabel[premiumProduct.itemType]}
                </p>
                <h3 className="mt-5 font-serif text-4xl font-black leading-none md:text-5xl">{premiumProduct.name}</h3>
                <p className="mt-4 max-w-xl text-sm font-semibold leading-7 text-muted-foreground">{premiumProduct.description}</p>
                <ul className="mt-6 grid gap-3">
                  {premiumProduct.benefits.map((benefit) => (
                    <li key={benefit} className="flex items-start gap-3 text-sm font-bold leading-6 text-muted-foreground">
                      <CheckCircle2 size={16} className="mt-1 shrink-0 text-primary-amber" />
                      <span>{benefit}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="border border-white/10 bg-white/5 p-5">
                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-primary-amber">monthly archive pass</p>
                <div className="mt-4 flex items-end gap-2">
                  <span className="font-serif text-5xl font-black leading-none">{premiumProduct.displayPrice}</span>
                  <span className="pb-1 text-xs font-black text-muted-foreground/60">{premiumProduct.cadence}</span>
                </div>
                <div className="mt-6 space-y-2 border-y border-white/10 py-4 text-xs font-bold text-muted-foreground/80">
                  <p>원두 라벨 사진 판독 한도 해제</p>
                  <p>기록 기반 취향 리포트</p>
                  <p>구독 취소 후 현재 결제 기간까지 이용</p>
                </div>
                <Link
                  href={checkoutHref(premiumProduct.itemType)}
                  onClick={() => trackEvent("pricing_cta_clicked", { itemType: premiumProduct.itemType, surface: "landing" })}
                  className="mt-6 inline-flex h-12 w-full items-center justify-center gap-2 border border-primary-amber bg-primary-amber px-4 text-sm font-black text-foreground transition hover:-translate-y-0.5"
                >
                  {premiumProduct.ctaLabel}
                  <ArrowRight size={15} />
                </Link>
              </div>
            </div>
          </article>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {secondaryProducts.map((itemType, index) => {
              const product = checkoutProductCatalog[itemType];

              return (
                <article
                  key={product.itemType}
                  className="border border-white/10 bg-white/5 p-5 shadow-[5px_5px_0_rgba(47,37,31,0.08)]"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary-amber">
                        0{index + 2} · {pricingLabelByItemType[product.itemType]}
                      </p>
                      <h3 className="mt-4 font-serif text-2xl font-black leading-tight text-foreground">{product.name}</h3>
                    </div>
                    <span className="grid size-10 shrink-0 place-items-center border border-white/10 text-primary-amber">
                      {product.itemType === "credits_10" ? <Sparkles size={17} /> : <BookOpen size={17} />}
                    </span>
                  </div>
                  <p className="mt-4 text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground/60">
                    {productDeckLabel[product.itemType]}
                  </p>
                  <div className="mt-5 flex items-end gap-2">
                    <span className="font-serif text-4xl font-black leading-none text-foreground">{product.displayPrice}</span>
                    <span className="pb-1 text-xs font-black text-muted-foreground/60">{product.cadence}</span>
                  </div>
                  <p className="mt-4 text-sm font-semibold leading-7 text-muted-foreground/80">{product.description}</p>
                  <Link
                    href={checkoutHref(product.itemType)}
                    onClick={() => trackEvent("pricing_cta_clicked", { itemType: product.itemType, surface: "landing" })}
                    className="mt-6 inline-flex h-11 w-full items-center justify-center gap-2 border border-white/10 bg-transparent px-4 text-xs font-black text-foreground transition hover:-translate-y-0.5 hover:bg-white/10"
                  >
                    {product.ctaLabel}
                    <ArrowRight size={13} />
                  </Link>
                </article>
              );
            })}
          </div>
        </div>
        </div>
      </details>
    </section>
  );
}
