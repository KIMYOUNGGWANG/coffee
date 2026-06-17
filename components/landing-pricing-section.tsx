"use client";

import Link from "next/link";
import { useEffect } from "react";
import { ArrowRight, BookOpen, CheckCircle2, CreditCard, Sparkles } from "lucide-react";
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
      className="border-y border-espresso/15 bg-[#f7efe2] py-14 md:py-20"
    >
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-10 px-4 md:px-8 lg:grid-cols-[0.82fr_1.18fr]">
        <div className="lg:sticky lg:top-8 lg:self-start">
          <span className="issue-marker inline-flex items-center gap-2 text-[11px] font-black tracking-wide text-[#7b4d34]">
            <CreditCard size={13} />
            가격 안내
          </span>
          <h2 className="mt-5 break-keep font-serif text-3xl font-black leading-tight text-espresso md:text-5xl">
            가격은 기능표가 아니라
            <span className="block text-[#9f6a4a]">기록물의 단계입니다.</span>
          </h2>
          <p className="mt-5 max-w-lg text-sm font-semibold leading-7 text-espresso/62">
            무료 Taste Card로 시작하고, 더 많은 스캔과 리캡이 필요할 때 Premium으로 확장합니다. PDF는 쌓인 기록을
            보관 가능한 디지털 기록북으로 꺼내는 별도 결과물입니다.
          </p>
          <Link href="/legal/payment" className="mt-7 inline-flex border-b border-espresso text-xs font-black text-espresso transition hover:text-[#9f6a4a]">
            결제 및 환불 고지
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-4">
          <article className="relative overflow-hidden border border-espresso bg-espresso p-6 text-cream shadow-[10px_10px_0_rgba(47,37,31,0.15)] md:p-8">
            <div className="absolute right-5 top-5 hidden text-[9rem] font-black leading-none text-cream/[0.035] md:block">01</div>
            <div className="relative z-10 grid grid-cols-1 gap-8 md:grid-cols-[1fr_0.72fr]">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#e1b698]">
                  {pricingLabelByItemType[premiumProduct.itemType]} · {productDeckLabel[premiumProduct.itemType]}
                </p>
                <h3 className="mt-5 font-serif text-4xl font-black leading-none md:text-5xl">{premiumProduct.name}</h3>
                <p className="mt-4 max-w-xl text-sm font-semibold leading-7 text-cream/68">{premiumProduct.description}</p>
                <ul className="mt-6 grid gap-3">
                  {premiumProduct.benefits.map((benefit) => (
                    <li key={benefit} className="flex items-start gap-3 text-sm font-bold leading-6 text-cream/72">
                      <CheckCircle2 size={16} className="mt-1 shrink-0 text-[#e1b698]" />
                      <span>{benefit}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="border border-cream/20 bg-cream/[0.06] p-5">
                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#e1b698]">monthly archive pass</p>
                <div className="mt-4 flex items-end gap-2">
                  <span className="font-serif text-5xl font-black leading-none">{premiumProduct.displayPrice}</span>
                  <span className="pb-1 text-xs font-black text-cream/48">{premiumProduct.cadence}</span>
                </div>
                <div className="mt-6 space-y-2 border-y border-cream/15 py-4 text-xs font-bold text-cream/58">
                  <p>AI 원두 스캔 한도 해제</p>
                  <p>기록 기반 취향 리포트</p>
                  <p>구독 취소 후 현재 결제 기간까지 이용</p>
                </div>
                <Link
                  href={checkoutHref(premiumProduct.itemType)}
                  onClick={() => trackEvent("pricing_cta_clicked", { itemType: premiumProduct.itemType, surface: "landing" })}
                  className="mt-6 inline-flex h-12 w-full items-center justify-center gap-2 border border-[#e1b698] bg-[#e1b698] px-4 text-sm font-black text-espresso transition hover:-translate-y-0.5"
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
                  className="border border-espresso/20 bg-[#fffaf0] p-5 shadow-[5px_5px_0_rgba(47,37,31,0.08)]"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#9f6a4a]">
                        0{index + 2} · {pricingLabelByItemType[product.itemType]}
                      </p>
                      <h3 className="mt-4 font-serif text-2xl font-black leading-tight text-espresso">{product.name}</h3>
                    </div>
                    <span className="grid size-10 shrink-0 place-items-center border border-espresso/15 text-[#9f6a4a]">
                      {product.itemType === "credits_10" ? <Sparkles size={17} /> : <BookOpen size={17} />}
                    </span>
                  </div>
                  <p className="mt-4 text-xs font-bold uppercase tracking-[0.18em] text-espresso/38">
                    {productDeckLabel[product.itemType]}
                  </p>
                  <div className="mt-5 flex items-end gap-2">
                    <span className="font-serif text-4xl font-black leading-none text-espresso">{product.displayPrice}</span>
                    <span className="pb-1 text-xs font-black text-espresso/45">{product.cadence}</span>
                  </div>
                  <p className="mt-4 text-sm font-semibold leading-7 text-espresso/58">{product.description}</p>
                  <Link
                    href={checkoutHref(product.itemType)}
                    onClick={() => trackEvent("pricing_cta_clicked", { itemType: product.itemType, surface: "landing" })}
                    className="mt-6 inline-flex h-11 w-full items-center justify-center gap-2 border border-espresso/20 bg-transparent px-4 text-xs font-black text-espresso transition hover:-translate-y-0.5 hover:bg-[#f2eadb]"
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
    </section>
  );
}
