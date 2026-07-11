import type { Metadata } from "next";
import { Settings } from "lucide-react";

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
      <section className="mx-auto grid w-full max-w-5xl gap-5 pb-4">
        <SettingsUsageBilling />
        <AccountDataControls />
      </section>
    </FigmaDashboardShell>
  );
}
