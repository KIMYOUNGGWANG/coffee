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
  { id: "shelf", label: "서랍", icon: Library },
  { id: "log", label: "노트", icon: NotebookTabs },
  { id: "passport", label: "취향", icon: BookOpenText },
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
                ? "bg-background-dark text-[#FFF8EC] shadow-[0_12px_30px_rgba(73,48,36,0.2)]"
                : "text-muted-foreground hover:bg-background-dark/6 hover:text-background-dark",
            )}
          >
            <Icon aria-hidden="true" size={20} strokeWidth={isActive ? 2.3 : 1.7} />
            <span>{item.label}</span>
          </button>
        );
      })}
      <Link
        href="/settings"
        className="flex min-h-12 flex-1 flex-col items-center justify-center gap-1 rounded-2xl px-1 text-[11px] font-bold text-muted-foreground transition-[color,background-color,transform] hover:bg-background-dark/6 hover:text-background-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-amber active:scale-95 md:min-h-10 md:flex-none md:flex-row md:gap-2 md:px-4 md:text-xs"
      >
        <Settings aria-hidden="true" size={20} strokeWidth={1.7} />
        <span>설정</span>
      </Link>
    </>
  );
}

export function DashboardDesktopNavigation(props: DashboardNavigationProps) {
  return (
    <nav aria-label="대시보드 주요 메뉴" className="hidden items-center gap-1 rounded-[1.25rem] border border-background-dark/10 bg-white/42 p-1 md:inline-flex">
      <NavigationItems {...props} />
    </nav>
  );
}

export function DashboardMobileNavigation(props: DashboardNavigationProps) {
  return (
    <nav
      aria-label="대시보드 주요 메뉴"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-background-dark/10 bg-[#FFF8EC]/92 px-3 pb-[calc(0.55rem+env(safe-area-inset-bottom))] pt-2.5 shadow-[0_-18px_38px_rgba(73,48,36,0.16)] backdrop-blur-xl md:hidden"
    >
      <div className="mx-auto flex max-w-md items-center gap-1 rounded-[1.45rem] border border-background-dark/10 bg-white/76 p-1 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]">
        <NavigationItems {...props} />
      </div>
    </nav>
  );
}
