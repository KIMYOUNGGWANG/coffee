import type { Metadata } from "next";
import Link from "next/link";
import { CreditCard, Settings } from "lucide-react";

import { AccountDataControls } from "@/components/account-data-controls";
import { FigmaDashboardShell } from "@/components/figma-dashboard-shell";
import { SettingsUsageBilling } from "@/components/settings-usage-billing";

export const metadata: Metadata = {
  title: "계정 및 데이터 설정 | CoffeeDex",
  description: "CoffeeDex 커피 기억을 내려받거나 계정 데이터를 관리합니다.",
};

export default function SettingsPage() {
  return (
    <FigmaDashboardShell
      activeHref="/settings"
      actions={<span className="grid size-10 place-items-center rounded-2xl bg-[var(--surface-strong)] text-[var(--accent-foreground)]"><Settings aria-hidden="true" size={18} /></span>}
      description="내 커피 기록을 소유하고, 필요한 형식으로 보관하며, 계정 수명 주기를 직접 관리하세요."
      eyebrow="CoffeeDex settings"
      title="계정 및 데이터"
    >
      <section className="coffee-workspace space-y-6">
        <SettingsUsageBilling />

        <div className="dashboard-panel mx-auto max-w-3xl p-5">
          <div className="flex items-start gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-2xl border border-primary-amber/30 bg-primary-amber/10 text-primary-amber">
              <CreditCard aria-hidden="true" size={18} />
            </span>
            <div className="min-w-0">
              <p className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-primary-amber">Secondary offers</p>
              <h2 className="mt-1 font-serif text-xl font-black">추가 기능 및 결제</h2>
              <p className="mt-2 text-xs font-semibold leading-5 text-muted-foreground">
                기록과 데이터 관리는 무료로 유지하고, 더 많은 스캔·Premium·PDF 기록북은 필요할 때만 선택하세요.
              </p>
              <Link
                href="/dashboard?checkout_intent=premium_subscription"
                className="mt-4 inline-flex min-h-11 items-center justify-center rounded-xl border border-[var(--border)] px-4 text-xs font-bold text-foreground transition-colors hover:bg-[var(--surface-muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-amber"
              >
                추가 기능 및 결제 보기
              </Link>
            </div>
          </div>
        </div>
      </section>

      <AccountDataControls />
    </FigmaDashboardShell>
  );
}
