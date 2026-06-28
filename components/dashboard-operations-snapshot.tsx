"use client";

import { BarChart3, Camera, Globe2, ShieldCheck, Sparkles, TrendingUp } from "lucide-react";
import type { TasteAnalyticsData, TastingCardData, UserProfileData } from "@/hooks/useTastingCards";

type DashboardOperationsSnapshotProps = {
  readonly cards: readonly TastingCardData[] | undefined;
  readonly analytics: TasteAnalyticsData | undefined;
  readonly profile: UserProfileData | undefined;
};

type Stat = {
  readonly label: string;
  readonly value: string;
  readonly helper: string;
};

function formatCount(value: number, unit = "개"): string {
  return `${value.toLocaleString("ko-KR")}${unit}`;
}

function recentCardCount(cards: readonly TastingCardData[], now = Date.now()): number {
  const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;

  return cards.filter((card) => {
    const createdAt = new Date(card.created_at).getTime();
    return Number.isFinite(createdAt) && createdAt >= sevenDaysAgo;
  }).length;
}

function uniqueOriginCount(cards: readonly TastingCardData[]): number {
  return new Set(
    cards
      .map((card) => card.package_origin ?? card.footer_meta.origin ?? "")
      .map((origin) => origin.trim())
      .filter(Boolean),
  ).size;
}

function topOrigins(cards: readonly TastingCardData[]): readonly string[] {
  const counts = new Map<string, number>();

  for (const card of cards) {
    const origin = (card.package_origin ?? card.footer_meta.origin ?? "").trim();
    if (!origin) continue;
    counts.set(origin, (counts.get(origin) ?? 0) + 1);
  }

  return [...counts.entries()]
    .sort(([firstOrigin, firstCount], [secondOrigin, secondCount]) => secondCount - firstCount || firstOrigin.localeCompare(secondOrigin))
    .slice(0, 5)
    .map(([origin]) => origin);
}

function scanSaveRate(cards: readonly TastingCardData[], scansUsed: number): number {
  if (scansUsed <= 0) return 0;
  const savedScans = cards.filter((card) => card.scan_source === "gemini").length;
  return Math.min(100, Math.round((savedScans / scansUsed) * 100));
}

export function DashboardOperationsSnapshot({
  cards,
  analytics,
  profile,
}: DashboardOperationsSnapshotProps) {
  const safeCards = cards ?? [];
  const totalCards = analytics?.totalCards ?? safeCards.length;
  const confirmedCards = safeCards.filter((card) => card.confirmed_at).length;
  const scansUsed = profile?.scans_used ?? 0;
  const scanLimit = profile?.monthly_scan_limit ?? 5;
  const savedScanRate = scanSaveRate(safeCards, scansUsed);
  const repurchaseAgain = safeCards.filter((card) => card.repurchase_intent === "again").length;
  const origins = topOrigins(safeCards);
  const totalOrigins = uniqueOriginCount(safeCards);
  const stats: readonly Stat[] = [
    {
      label: "전체 기록",
      value: formatCount(totalCards),
      helper: `${formatCount(confirmedCards)} 확정`,
    },
    {
      label: "AI 스캔 사용",
      value: `${scansUsed} / ${scanLimit}`,
      helper: savedScanRate > 0 ? `저장 전환 ${savedScanRate}%` : "게스트 저장 흐름 점검",
    },
    {
      label: "다시 살 신호",
      value: formatCount(repurchaseAgain),
      helper: "재구매 후보",
    },
    {
      label: "7일 신규 기록",
      value: formatCount(recentCardCount(safeCards)),
      helper: "최근 활성도",
    },
  ];

  return (
    <section className="mx-auto max-w-4xl rounded-3xl border border-primary-amber/20 bg-[#f4eadb] p-5 text-[#2f251f] shadow-[0_24px_60px_rgba(0,0,0,0.2)] sm:p-6" aria-labelledby="operations-snapshot-title">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#c89a64]/30 bg-white/60 px-3 py-1.5 text-[10px] font-black uppercase text-[#8a5d3d]">
            <BarChart3 aria-hidden="true" size={13} />
            KPI 스냅샷
          </div>
          <h2 id="operations-snapshot-title" className="mt-3 break-keep font-serif text-2xl font-black leading-tight">
            기록과 온보딩 건강도
          </h2>
          <p className="mt-2 max-w-2xl break-keep text-sm font-semibold leading-6 text-[#675243]">
            게스트 스캔, 확정 기록, 재구매 신호를 한 화면에서 확인해 초반 이탈과 저장 전환을 놓치지 않습니다.
          </p>
        </div>
        <span className="inline-flex min-h-9 items-center gap-2 rounded-full bg-[#193b32] px-3 text-xs font-black text-[#d8f3df]">
          <ShieldCheck aria-hidden="true" size={14} />
          연결됨
        </span>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className="rounded-2xl border border-[#d7c2a9] bg-white/70 p-4 shadow-sm">
            <p className="break-keep text-xs font-black text-[#6f5b4b]">{stat.label}</p>
            <p className="mt-4 font-serif text-3xl font-black leading-none text-[#17110d]">{stat.value}</p>
            <p className="mt-3 break-keep text-xs font-bold text-[#7c6757]">{stat.helper}</p>
          </div>
        ))}
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-2xl border border-[#d7c2a9] bg-white/60 p-4">
          <div className="flex items-center justify-between gap-3">
            <p className="inline-flex items-center gap-2 text-xs font-black text-[#6f5b4b]">
              <Globe2 aria-hidden="true" size={14} />
              주요 원산지
            </p>
            <p className="text-xs font-black text-[#17110d]">총 {formatCount(totalOrigins, "곳")}</p>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {(origins.length > 0 ? origins : ["첫 원산지 대기"]).map((origin) => (
              <span key={origin} className="rounded-xl border border-[#d7c2a9] bg-[#fbf7ef] px-3 py-2 text-xs font-black text-[#3b2b20]">
                {origin}
              </span>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-[#d7c2a9] bg-[#2f251f] p-4 text-[#f6efe3]">
          <p className="inline-flex items-center gap-2 text-xs font-black text-primary-amber">
            <Camera aria-hidden="true" size={14} />
            게스트 모드 체크
          </p>
          <p className="mt-3 break-keep text-sm font-semibold leading-6 text-[#f6efe3]/78">
            로그인 전에도 첫 스캔과 초안을 경험하게 하고, 저장 순간에만 계정 연결을 요청하는 흐름을 계속 관찰합니다.
          </p>
          <div className="mt-3 flex items-center gap-2 text-xs font-black text-[#f6efe3]">
            <TrendingUp aria-hidden="true" size={14} />
            <span>저장 전환을 핵심 운영 지표로 유지</span>
          </div>
        </div>
      </div>

      <div className="mt-4 rounded-2xl border border-[#d7c2a9] bg-white/50 p-4">
        <p className="inline-flex items-center gap-2 break-keep text-sm font-black text-[#3b2b20]">
          <Sparkles aria-hidden="true" size={15} />
          {analytics?.aiAnalysis || "첫 기록이 쌓이면 취향 스냅샷이 여기에 표시됩니다."}
        </p>
      </div>
    </section>
  );
}
