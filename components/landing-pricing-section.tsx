"use client";

import Link from "next/link";
import { useEffect } from "react";
import { ArrowRight, CheckCircle2, CreditCard } from "lucide-react";
import { checkoutProductCatalog, checkoutProductOrder, type CheckoutProductItemType } from "@/lib/commerce";
import { useAnalyticsEvents } from "@/hooks/use-analytics-events";

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

  return (
    <section
      data-testid="landing-pricing-section"
      className="rounded-3xl border border-white/50 bg-white/35 p-6 shadow-sm backdrop-blur-md md:p-8"
    >
      <div className="flex flex-col gap-3 border-b border-warm-gray pb-5 md:flex-row md:items-end md:justify-between">
        <div className="space-y-2">
          <span className="inline-flex rounded-full border border-caramel/20 bg-caramel/10 px-3 py-1 text-[9px] font-extrabold uppercase tracking-widest text-caramel">
            Pricing
          </span>
          <h2 className="font-serif text-2xl font-bold text-espresso md:text-3xl">가격과 결제 흐름</h2>
          <p className="max-w-2xl text-xs leading-relaxed text-espresso/60">
            무료 기록으로 시작하고, 스캔 한도·PDF 기록북·월간 리포트가 필요해지는 순간에만 결제합니다.
          </p>
        </div>
        <Link href="/legal/payment" className="text-xs font-bold text-caramel hover:text-espresso">
          결제 및 환불 고지
        </Link>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        {checkoutProductOrder.map((itemType) => {
          const product = checkoutProductCatalog[itemType];
          const isFeatured = itemType === "premium_subscription";

          return (
            <article
              key={product.itemType}
              className={`flex min-h-[20rem] flex-col justify-between rounded-2xl border bg-white p-5 text-left shadow-sm ${
                isFeatured ? "border-caramel/60" : "border-warm-gray"
              }`}
            >
              <div className="space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-extrabold uppercase tracking-widest text-caramel">{product.shortName}</p>
                    <h3 className="mt-1 text-base font-bold text-espresso">{product.name}</h3>
                  </div>
                  <CreditCard size={17} className="text-caramel" />
                </div>
                <div>
                  <span className="text-2xl font-extrabold text-espresso">{product.displayPrice}</span>
                  <span className="ml-2 text-xs font-bold text-espresso/45">{product.cadence}</span>
                </div>
                <p className="text-xs leading-relaxed text-espresso/60">{product.description}</p>
                <ul className="space-y-2">
                  {product.benefits.map((benefit) => (
                    <li key={benefit} className="flex items-start gap-2 text-xs leading-relaxed text-espresso/65">
                      <CheckCircle2 size={13} className="mt-0.5 shrink-0 text-caramel" />
                      <span>{benefit}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <Link
                href={checkoutHref(product.itemType)}
                onClick={() => trackEvent("pricing_cta_clicked", { itemType: product.itemType, surface: "landing" })}
                className={`mt-5 inline-flex items-center justify-center gap-1.5 rounded-2xl px-4 py-3 text-xs font-extrabold transition-all ${
                  isFeatured ? "bg-espresso text-white hover:bg-espresso/90" : "border border-warm-gray text-espresso hover:bg-cream"
                }`}
              >
                {product.ctaLabel}
                <ArrowRight size={13} />
              </Link>
            </article>
          );
        })}
      </div>
    </section>
  );
}
