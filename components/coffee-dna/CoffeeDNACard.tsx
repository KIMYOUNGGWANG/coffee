"use client";

import React from "react";
import { Sparkles, Share2, Star, Heart } from "lucide-react";
import FluidRadarChart from "@/components/FluidRadarChart";
import { cn } from "@/lib/utils";

export interface CoffeeDNAData {
  totalBeans: number;
  averageRating: number | null;
  wantAgainRate: number;
  topOrigins: { origin: string; count: number }[];
  topRoasters: { roaster: string; count: number }[];
  tasteProfile: { acidity: number; sweetness: number; body: number } | null;
  typeLabel: string;
}

interface CoffeeDNACardProps {
  readonly dna: CoffeeDNAData;
  readonly onShareClick: () => void;
  readonly className?: string;
}

const getFlagEmoji = (origin: string): string => {
  const org = origin.toLowerCase();
  if (org.includes("에티오피아") || org.includes("ethiopia")) return "🇪🇹";
  if (org.includes("콜롬비아") || org.includes("colombia")) return "🇨🇴";
  if (org.includes("케냐") || org.includes("kenya")) return "🇰🇪";
  if (org.includes("브라질") || org.includes("brazil")) return "🇧🇷";
  if (org.includes("과테말라") || org.includes("guatemala")) return "🇬🇹";
  if (org.includes("인도네시아") || org.includes("indonesia")) return "🇮🇩";
  if (org.includes("코스타리카") || org.includes("costa rica")) return "🇨🇷";
  if (org.includes("파나마") || org.includes("panama")) return "🇵🇦";
  return "📍";
};

export default function CoffeeDNACard({ dna, onShareClick, className }: CoffeeDNACardProps) {
  const {
    totalBeans,
    averageRating,
    wantAgainRate,
    topOrigins,
    tasteProfile,
    typeLabel,
  } = dna;

  const isDnaLocked = totalBeans < 5;
  const remainingBeans = 5 - totalBeans;
  const progressPercent = Math.min((totalBeans / 5) * 100, 100);

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl border border-white/10 bg-[#111] p-6 shadow-xl transition-all hover:border-white/15",
        className
      )}
    >
      {/* Decorative subtle ambient lights */}
      <div className="absolute -right-20 -top-20 -z-10 size-40 rounded-full bg-[#D4AF37]/5 blur-3xl" />
      <div className="absolute -left-20 -bottom-20 -z-10 size-40 rounded-full bg-white/5 blur-3xl" />

      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/5 pb-4">
        <div className="flex items-center gap-2">
          <div className="flex size-7 items-center justify-center rounded-lg bg-[#D4AF37]/10 text-[#D4AF37]">
            <Sparkles size={14} />
          </div>
          <div>
            <h4 className="text-xs font-bold text-white/60 uppercase tracking-wider">나의 커피 DNA</h4>
            {isDnaLocked ? (
              <p className="text-xs font-medium text-white/40 mt-0.5">분석을 위해 원두 정보를 채워주세요</p>
            ) : (
              <p className="text-sm font-extrabold text-[#D4AF37] mt-0.5">{typeLabel}</p>
            )}
          </div>
        </div>
        {!isDnaLocked && (
          <button
            onClick={onShareClick}
            className="flex items-center gap-1 rounded-lg border border-[#D4AF37]/20 bg-[#D4AF37]/10 px-2.5 py-1 text-[11px] font-bold text-[#D4AF37] transition-all hover:bg-[#D4AF37]/20 active:scale-95 cursor-pointer"
          >
            <Share2 size={12} />
            <span>공유</span>
          </button>
        )}
      </div>

      {/* Body: Locked state */}
      {isDnaLocked ? (
        <div className="flex flex-col py-8">
          <div className="text-center mb-6">
            <span className="text-3xl">🔒</span>
            <h5 className="mt-3 text-sm font-bold text-white">커피 DNA 분석 잠김</h5>
            <p className="mt-1 text-xs text-white/40">
              최소 5개의 원두를 기록해야 분석이 시작됩니다.
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold">
              <span className="text-white/60">DNA 분석 완료도</span>
              <span className="text-[#D4AF37]">{totalBeans} / 5</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-white/5">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#D4AF37] to-amber-500 transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <p className="text-[10px] text-white/30 text-center mt-1.5">
              앞으로 {remainingBeans}개의 원두를 더 선반에 기록해보세요!
            </p>
          </div>
        </div>
      ) : (
        /* Body: Unlocked state */
        <div className="flex flex-col gap-6 pt-5">
          {/* Radar Chart */}
          <div className="flex flex-col items-center justify-center min-h-[190px] border-b border-white/5 pb-4">
            {tasteProfile ? (
              <FluidRadarChart
                acidity={tasteProfile.acidity}
                sweetness={tasteProfile.sweetness}
                body={tasteProfile.body}
                size={160}
              />
            ) : (
              <div className="flex flex-col items-center justify-center text-center p-4 min-h-[140px] bg-white/[0.02] rounded-xl border border-white/5">
                <p className="text-xs text-white/50 leading-relaxed">
                  ☕ 테이스팅 카드를 만드시면<br />더 자세한 맛 프로필 분석이 제공됩니다.
                </p>
              </div>
            )}
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-xl bg-white/[0.02] border border-white/5 p-3 text-center">
              <span className="text-[10px] text-white/40 font-bold block mb-1">총 기록</span>
              <span className="text-sm font-extrabold text-white">{totalBeans}개</span>
            </div>
            <div className="rounded-xl bg-white/[0.02] border border-white/5 p-3 text-center">
              <span className="text-[10px] text-white/40 font-bold block mb-1">평균 별점</span>
              <span className="text-sm font-extrabold text-[#D4AF37] flex items-center justify-center gap-0.5">
                <Star size={11} className="fill-[#D4AF37] text-[#D4AF37]" />
                {averageRating !== null ? averageRating.toFixed(1) : "—"}
              </span>
            </div>
            <div className="rounded-xl bg-white/[0.02] border border-white/5 p-3 text-center">
              <span className="text-[10px] text-white/40 font-bold block mb-1">재구매 희망</span>
              <span className="text-sm font-extrabold text-[#FF6B6B] flex items-center justify-center gap-0.5">
                <Heart size={11} className="fill-[#FF6B6B] text-[#FF6B6B]" />
                {wantAgainRate}%
              </span>
            </div>
          </div>

          {/* Top Origins */}
          {topOrigins.length > 0 && (
            <div className="space-y-2">
              <span className="text-[10px] text-white/40 font-bold uppercase tracking-wider block">선호하는 원산지</span>
              <div className="flex flex-wrap gap-2">
                {topOrigins.slice(0, 3).map(({ origin, count }, index) => (
                  <div
                    key={origin}
                    className="flex items-center gap-1.5 rounded-lg bg-white/[0.02] border border-white/5 px-2.5 py-1 text-xs font-semibold text-white/80"
                  >
                    <span className="text-sm">{getFlagEmoji(origin)}</span>
                    <span>{origin}</span>
                    <span className="text-[10px] text-[#D4AF37] font-bold">x{count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
