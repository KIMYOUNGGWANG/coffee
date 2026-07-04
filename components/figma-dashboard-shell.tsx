import Link from "next/link";
import type { ReactNode } from "react";
import { Coffee, Home, LayoutDashboard, LifeBuoy, Plus, Settings } from "lucide-react";
import { coffeeDexBrand } from "@/lib/brand";
import { cn } from "@/lib/utils";

type FigmaDashboardShellProps = {
  readonly children: ReactNode;
  readonly title: string;
  readonly description?: string;
  readonly eyebrow?: string;
  readonly activeHref?: string;
  readonly actions?: ReactNode;
  readonly compact?: boolean;
};

const shellNavItems = [
  { href: "/", label: "홈", icon: Home },
  { href: "/capture", label: "새 노트", icon: Plus },
  { href: "/dashboard", label: "내 서랍", icon: LayoutDashboard },
  { href: "/settings", label: "설정", icon: Settings },
  { href: "/support/billing", label: "도움말", icon: LifeBuoy },
] as const;

export function FigmaDashboardShell({
  children,
  title,
  description,
  eyebrow = "CoffeeDex",
  activeHref,
  actions,
  compact = false,
}: FigmaDashboardShellProps) {
  return (
    <main className="min-h-[100dvh] bg-[var(--background)] text-[var(--foreground)]">
      <div className="mx-auto grid w-full max-w-[88rem] gap-4 px-3 pb-[calc(7.25rem+env(safe-area-inset-bottom))] pt-3 md:grid-cols-[15.5rem_minmax(0,1fr)] md:px-5 md:pb-5 md:pt-5">
        <aside className="dashboard-rail">
          <Link href="/" className="dashboard-brand" aria-label={`${coffeeDexBrand.name} 홈`}>
            <span className="dashboard-brand-mark">
              <Coffee aria-hidden="true" size={19} />
            </span>
            <span className="min-w-0">
              <span className="block text-sm font-black leading-none">{coffeeDexBrand.name}</span>
              <span className="mt-1 block text-[10px] font-extrabold uppercase tracking-[0.18em] text-[var(--muted-foreground)]">
                Coffee memory
              </span>
            </span>
          </Link>

          <nav className="dashboard-nav" aria-label="CoffeeDex 화면 이동">
            {shellNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeHref === item.href;
              return (
                <Link className="dashboard-nav-link" data-active={isActive ? "true" : undefined} href={item.href} key={item.href}>
                  <Icon aria-hidden="true" size={16} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="dashboard-rail-note">
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[var(--accent)]">비공개 저장</p>
            <p className="mt-2 break-keep text-xs font-bold leading-5 text-[var(--muted-foreground)]">
              원두 기억은 내 서랍에 먼저 쌓이고, 공유는 내가 고를 때만 열립니다.
            </p>
          </div>
        </aside>

        <section className="min-w-0">
          <header className={cn("dashboard-topbar", compact && "dashboard-topbar-compact")}>
            <div className="min-w-0">
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[var(--accent)]">{eyebrow}</p>
              <h1 className="mt-2 break-keep text-2xl font-black leading-tight tracking-[-0.01em] sm:text-3xl lg:text-4xl">
                {title}
              </h1>
              {description ? (
                <p className="mt-3 max-w-2xl break-keep text-sm font-semibold leading-6 text-[var(--muted-foreground)]">
                  {description}
                </p>
              ) : null}
            </div>
            {actions ? <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div> : null}
          </header>

          <div className="mt-4 min-w-0">{children}</div>
        </section>
      </div>
      <nav className="dashboard-mobile-tabs" aria-label="CoffeeDex 모바일 화면 이동">
        {shellNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeHref === item.href;
          return (
            <Link aria-label={item.label} data-active={isActive ? "true" : undefined} href={item.href} key={item.href}>
              <Icon aria-hidden="true" size={18} />
            </Link>
          );
        })}
      </nav>
    </main>
  );
}
