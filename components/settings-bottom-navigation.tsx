"use client";

import Link from "next/link";
import { BookOpenText, Library, NotebookTabs, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { href: "/dashboard", label: "선반", icon: Library, active: false },
  { href: "/dashboard", label: "기록", icon: NotebookTabs, active: false },
  { href: "/dashboard", label: "패스포트", icon: BookOpenText, active: false },
  { href: "/settings", label: "설정", icon: Settings, active: true },
] as const;

export function SettingsBottomNavigation() {
  return (
    <nav
      aria-label="설정 주요 메뉴"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-background-dark/96 px-3 pb-[calc(0.5rem+env(safe-area-inset-bottom))] pt-2 backdrop-blur-xl md:hidden"
    >
      <div className="mx-auto flex max-w-md items-center gap-1">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.label}
              href={item.href}
              className={cn(
                "flex min-h-12 flex-1 flex-col items-center justify-center gap-1 rounded-xl px-1 text-[11px] font-bold transition-[color,background-color,transform] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-amber active:scale-95",
                item.active ? "bg-primary-amber/10 text-primary-amber" : "text-muted-foreground hover:bg-white/5 hover:text-foreground",
              )}
            >
              <Icon aria-hidden="true" size={20} strokeWidth={item.active ? 2.3 : 1.7} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
