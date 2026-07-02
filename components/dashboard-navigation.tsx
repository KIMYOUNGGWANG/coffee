"use client";

import Link from "next/link";
import { BookOpenText, Library, NotebookTabs, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

export type DashboardTab = "shelf" | "log" | "passport" | "settings";

type DashboardNavigationProps = {
  readonly activeTab: DashboardTab;
  readonly onTabChange: (tab: DashboardTab) => void;
};

const navigationItems = [
  { id: "shelf", label: "선반", icon: Library },
  { id: "log", label: "기록", icon: NotebookTabs },
  { id: "passport", label: "패스포트", icon: BookOpenText },
] as const satisfies readonly {
  readonly id: DashboardTab;
  readonly label: string;
  readonly icon: typeof Library;
}[];

function NavigationItems({ activeTab, onTabChange }: DashboardNavigationProps) {
  return (
    <>
      {navigationItems.map((item) => {
        const Icon = item.icon;
        const isActive = item.id === activeTab;

        return (
          <button
            key={item.id}
            type="button"
            aria-pressed={isActive}
            onClick={() => onTabChange(item.id)}
            className={cn(
              "flex min-h-12 flex-1 flex-col items-center justify-center gap-1 rounded-2xl px-1 text-[11px] font-bold transition-[color,background-color,transform,box-shadow] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-amber active:scale-95 md:min-h-10 md:flex-none md:flex-row md:gap-2 md:px-4 md:text-xs",
              isActive
                ? "bg-primary-amber text-[#120B07] shadow-[0_12px_30px_rgba(209,138,92,0.24)]"
                : "text-[#FFF8EC]/58 hover:bg-white/[0.07] hover:text-[#FFF8EC]",
            )}
          >
            <Icon aria-hidden="true" size={20} strokeWidth={isActive ? 2.3 : 1.7} />
            <span>{item.label}</span>
          </button>
        );
      })}
      <Link
        href="/settings"
        className="flex min-h-12 flex-1 flex-col items-center justify-center gap-1 rounded-2xl px-1 text-[11px] font-bold text-[#FFF8EC]/58 transition-[color,background-color,transform] hover:bg-white/[0.07] hover:text-[#FFF8EC] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-amber active:scale-95 md:min-h-10 md:flex-none md:flex-row md:gap-2 md:px-4 md:text-xs"
      >
        <Settings aria-hidden="true" size={20} strokeWidth={1.7} />
        <span>설정</span>
      </Link>
    </>
  );
}

export function DashboardDesktopNavigation(props: DashboardNavigationProps) {
  return (
    <nav aria-label="대시보드 주요 메뉴" className="hidden items-center gap-1 rounded-[1.25rem] border border-white/12 bg-white/[0.06] p-1 md:inline-flex">
      <NavigationItems {...props} />
    </nav>
  );
}

export function DashboardMobileNavigation(props: DashboardNavigationProps) {
  return (
    <nav
      aria-label="대시보드 주요 메뉴"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-white/12 bg-[#120B07]/92 px-3 pb-[calc(0.55rem+env(safe-area-inset-bottom))] pt-2.5 shadow-[0_-18px_42px_rgba(0,0,0,0.46)] backdrop-blur-xl md:hidden"
    >
      <div className="mx-auto flex max-w-md items-center gap-1 rounded-[1.45rem] border border-white/12 bg-white/[0.07] p-1 shadow-[inset_0_1px_0_rgba(255,248,236,0.1)]">
        <NavigationItems {...props} />
      </div>
    </nav>
  );
}
