"use client";

import Link from "next/link";
import { useState } from "react";
import { CreditCard, LifeBuoy, ShieldCheck, Sparkles } from "lucide-react";
import PaymentDialog from "@/components/PaymentDialog";

export function SettingsUsageBilling() {
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);

  return (
    <>
      <div className="grid gap-4 lg:grid-cols-[1.05fr_0.95fr]">
        <section className="dashboard-panel p-5 sm:p-6">
          <div className="flex items-start gap-3">
            <span className="grid size-11 shrink-0 place-items-center rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)] text-primary-amber">
              <ShieldCheck aria-hidden="true" size={19} />
            </span>
            <div className="min-w-0">
              <p className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-primary-amber">Free memory</p>
              <h2 className="mt-1 break-keep font-serif text-2xl font-black leading-tight">기록과 데이터 관리는 무료입니다</h2>
              <p className="mt-3 break-keep text-sm font-semibold leading-6 text-muted-foreground">
                저장한 커피 기억은 요금제와 관계없이 내려받을 수 있고, 계정 삭제도 여기에서 직접 관리합니다.
              </p>
              <div className="mt-4 grid gap-2 text-xs font-bold text-muted-foreground sm:grid-cols-3">
                <span className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2">비공개 기록</span>
                <span className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2">JSON/CSV 내보내기</span>
                <span className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2">계정 삭제</span>
              </div>
            </div>
          </div>
        </section>

        <section className="dashboard-panel p-5 sm:p-6">
          <div className="flex items-start gap-3">
            <span className="grid size-11 shrink-0 place-items-center rounded-2xl border border-primary-amber/25 bg-primary-amber/10 text-primary-amber">
              <CreditCard aria-hidden="true" size={19} />
            </span>
            <div className="min-w-0">
              <p className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-primary-amber">Optional add-ons</p>
              <h2 className="mt-1 break-keep font-serif text-2xl font-black leading-tight">필요할 때만 추가 기능을 엽니다</h2>
              <p className="mt-3 break-keep text-sm font-semibold leading-6 text-muted-foreground">
                라벨 스캔 보조, Premium, PDF 기록북은 선택 기능입니다. 재구매 기억 자체는 결제 없이 유지됩니다.
              </p>
              <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                <button
                  type="button"
                  onClick={() => setIsPaymentOpen(true)}
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[var(--surface-strong)] px-4 text-xs font-black text-[var(--accent-foreground)] transition hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-amber"
                >
                  <Sparkles aria-hidden="true" size={14} />
                  추가 기능 보기
                </button>
                <Link
                  href="/support/billing"
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[var(--border)] px-4 text-xs font-black text-foreground transition hover:bg-[var(--surface-muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-amber"
                >
                  <LifeBuoy aria-hidden="true" size={14} />
                  결제 도움말
                </Link>
              </div>
            </div>
          </div>
        </section>
      </div>

      <PaymentDialog isOpen={isPaymentOpen} onClose={() => setIsPaymentOpen(false)} />
    </>
  );
}
