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
              "flex min-h-12 flex-1 flex-col items-center justify-center gap-1 rounded-xl px-1 text-[11px] font-bold transition-[color,background-color,transform] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-amber active:scale-95 md:min-h-10 md:flex-none md:flex-row md:gap-2 md:px-4 md:text-xs",
              isActive
                ? "bg-primary-amber/10 text-primary-amber"
                : "text-muted-foreground hover:bg-white/5 hover:text-foreground",
            )}
          >
            <Icon aria-hidden="true" size={20} strokeWidth={isActive ? 2.3 : 1.7} />
            <span>{item.label}</span>
          </button>
        );
      })}
      <Link
        href="/settings"
        className="flex min-h-12 flex-1 flex-col items-center justify-center gap-1 rounded-xl px-1 text-[11px] font-bold text-muted-foreground transition-[color,background-color,transform] hover:bg-white/5 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-amber active:scale-95 md:min-h-10 md:flex-none md:flex-row md:gap-2 md:px-4 md:text-xs"
      >
        <Settings aria-hidden="true" size={20} strokeWidth={1.7} />
        <span>설정</span>
      </Link>
    </>
  );
}

export function DashboardDesktopNavigation(props: DashboardNavigationProps) {
  return (
    <nav aria-label="대시보드 주요 메뉴" className="hidden items-center gap-1 md:flex">
      <NavigationItems {...props} />
    </nav>
  );
}

export function DashboardMobileNavigation(props: DashboardNavigationProps) {
  return (
    <nav
      aria-label="대시보드 주요 메뉴"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-background-dark/96 px-3 pb-[calc(0.5rem+env(safe-area-inset-bottom))] pt-2 backdrop-blur-xl md:hidden"
    >
      <div className="mx-auto flex max-w-md items-center gap-1">
        <NavigationItems {...props} />
      </div>
    </nav>
  );
}
