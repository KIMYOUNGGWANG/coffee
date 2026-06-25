"use client";

import React from "react";
import { Star, Heart, Award } from "lucide-react";

export interface DNAExportCardProps {
  readonly userName: string;
  readonly totalBeans: number;
  readonly averageRating: number | null;
  readonly wantAgainRate: number;
  readonly topOrigins: { origin: string; count: number }[];
  readonly tasteProfile: { acidity: number; sweetness: number; body: number } | null;
  readonly typeLabel: string;
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

function StaticRadarChart({ acidity, sweetness, body, size = 260 }: { acidity: number; sweetness: number; body: number; size?: number }) {
  const center = size / 2;
  const maxVal = 5;
  const rScale = (size * 0.35) / maxVal;
  const angles = [-Math.PI / 2, Math.PI / 6, (5 * Math.PI) / 6];
  const labels = ["산미 (Acidity)", "단맛 (Sweetness)", "바디감 (Body)"];

  const getCoords = (val: number, angle: number) => {
    const r = val * rScale;
    const x = center + r * Math.cos(angle);
    const y = center + r * Math.sin(angle);
    return { x, y };
  };

  const points = [
    getCoords(acidity || 1, angles[0]),
    getCoords(sweetness || 1, angles[1]),
    getCoords(body || 1, angles[2]),
  ];
  const polyPointsString = points.map((p) => `${p.x},${p.y}`).join(" ");

  const gridLevels = [1, 2, 3, 4, 5];

  return (
    <svg width={size} height={size} className="overflow-visible mx-auto">
      {/* Grid rings */}
      {gridLevels.map((level) => {
        const gridPoints = angles.map((angle) => getCoords(level, angle));
        const gridPointsStr = gridPoints.map((p) => `${p.x},${p.y}`).join(" ");
        return (
          <polygon
            key={level}
            points={gridPointsStr}
            fill="none"
            stroke="rgba(255, 255, 255, 0.08)"
            strokeWidth={level === 5 ? "1.5" : "0.75"}
            strokeDasharray={level === 5 ? "none" : "3,3"}
          />
        );
      })}

      {/* Grid axes */}
      {angles.map((angle, i) => {
        const outerCoords = getCoords(maxVal, angle);
        return (
          <line
            key={i}
            x1={center}
            y1={center}
            x2={outerCoords.x}
            y2={outerCoords.y}
            stroke="rgba(255, 255, 255, 0.15)"
            strokeWidth="1"
          />
        );
      })}

      {/* Value polygon */}
      <polygon
        points={polyPointsString}
        fill="rgba(212, 175, 55, 0.22)"
        stroke="#D4AF37"
        strokeWidth="2.5"
      />

      {/* Point markers */}
      {points.map((p, i) => (
        <circle
          key={i}
          cx={p.x}
          cy={p.y}
          r="5"
          fill="#D4AF37"
          stroke="#000"
          strokeWidth="1.5"
        />
      ))}

      {/* Labels */}
      {angles.map((angle, i) => {
        const labelCoords = getCoords(maxVal + 0.9, angle);
        let textAnchor: "middle" | "start" | "end" = "middle";
        let dy = "0.35em";

        if (i === 1) {
          textAnchor = "start";
          dy = "0.7em";
        } else if (i === 2) {
          textAnchor = "end";
          dy = "0.7em";
        } else {
          dy = "-0.6em";
        }

        return (
          <text
            key={i}
            x={labelCoords.x}
            y={labelCoords.y}
            textAnchor={textAnchor}
            dy={dy}
            fill="rgba(255, 255, 255, 0.5)"
            fontSize="11px"
            fontWeight="bold"
            letterSpacing="0.05em"
          >
            {labels[i]}
          </text>
        );
      })}
    </svg>
  );
}

export default function DNAExportCard({
  userName,
  totalBeans,
  averageRating,
  wantAgainRate,
  topOrigins,
  tasteProfile,
  typeLabel,
}: DNAExportCardProps) {
  const favoriteOrigin = topOrigins[0]?.origin || "📍 커피 탐험 중";

  return (
    <div
      id="dna-export-card"
      style={{ width: "1080px", height: "1920px" }}
      className="relative flex flex-col justify-between bg-black p-20 text-white select-none border border-white/10"
    >
      {/* Decorative gradients */}
      <div className="absolute left-1/4 top-1/4 -translate-x-1/2 -translate-y-1/2 -z-10 size-[600px] rounded-full bg-[#D4AF37]/5 blur-[160px]" />
      <div className="absolute right-1/4 bottom-1/4 translate-x-1/2 translate-y-1/2 -z-10 size-[600px] rounded-full bg-white/5 blur-[160px]" />

      {/* Top Section */}
      <div className="flex flex-col items-center text-center">
        <span className="text-sm font-extrabold text-[#D4AF37] tracking-[0.4em] uppercase">
          ☕ COFFEEDEX
        </span>
        <div className="mt-8 h-[2px] w-20 bg-[#D4AF37]/50" />
        <h2 className="mt-10 text-4xl font-extrabold tracking-tight font-serif">
          나의 커피 DNA
        </h2>
        <p className="mt-4 text-lg font-medium text-white/50">
          {userName}님의 스페셜티 커피 취향 프로필
        </p>
      </div>

      {/* Middle Section: Radar Chart */}
      <div className="flex flex-col items-center justify-center my-10">
        <div className="rounded-3xl border border-white/5 bg-white/[0.02] p-12 shadow-2xl relative w-[600px] flex flex-col items-center">
          <div className="absolute top-8 left-12 flex items-center gap-2 text-white/40">
            <Award size={16} className="text-[#D4AF37]" />
            <span className="text-xs font-bold uppercase tracking-wider">Tasting Profile</span>
          </div>

          <div className="py-8">
            {tasteProfile ? (
              <StaticRadarChart
                acidity={tasteProfile.acidity}
                sweetness={tasteProfile.sweetness}
                body={tasteProfile.body}
                size={340}
              />
            ) : (
              <div className="flex flex-col items-center justify-center text-center p-8 min-h-[300px]">
                <p className="text-lg text-white/40 leading-relaxed font-medium">
                  기록된 테이스팅 데이터가 부족합니다.<br />원두의 테이스팅 노트를 더 기록해주세요.
                </p>
              </div>
            )}
          </div>

          <div className="mt-6 text-center">
            <span className="text-xs font-extrabold text-white/30 uppercase tracking-[0.2em]">TYPE</span>
            <p className="mt-2 text-2xl font-black text-[#D4AF37] tracking-wide">{typeLabel}</p>
          </div>
        </div>
      </div>

      {/* Bottom Section: Stats & Brand */}
      <div className="space-y-16">
        {/* Statistics Grid */}
        <div className="grid grid-cols-2 gap-8 max-w-[800px] mx-auto">
          <div className="rounded-2xl border border-white/5 bg-white/[0.01] p-6 flex flex-col items-center text-center justify-center">
            <span className="text-sm text-white/40 font-bold uppercase tracking-wider">총 원두 기록</span>
            <span className="mt-3 text-3xl font-black">{totalBeans}개</span>
          </div>
          <div className="rounded-2xl border border-white/5 bg-white/[0.01] p-6 flex flex-col items-center text-center justify-center">
            <span className="text-sm text-white/40 font-bold uppercase tracking-wider">평균 평점</span>
            <span className="mt-3 text-3xl font-black text-[#D4AF37] flex items-center gap-1.5 justify-center">
              <Star size={24} className="fill-[#D4AF37] text-[#D4AF37]" />
              {averageRating !== null ? averageRating.toFixed(1) : "—"}
            </span>
          </div>
          <div className="rounded-2xl border border-white/5 bg-white/[0.01] p-6 flex flex-col items-center text-center justify-center">
            <span className="text-sm text-white/40 font-bold uppercase tracking-wider">재구매 의사</span>
            <span className="mt-3 text-3xl font-black text-[#FF6B6B] flex items-center gap-1.5 justify-center">
              <Heart size={24} className="fill-[#FF6B6B] text-[#FF6B6B]" />
              {wantAgainRate}%
            </span>
          </div>
          <div className="rounded-2xl border border-white/5 bg-white/[0.01] p-6 flex flex-col items-center text-center justify-center">
            <span className="text-sm text-white/40 font-bold uppercase tracking-wider">선호 원산지</span>
            <span className="mt-3 text-2xl font-black text-white/90 flex items-center gap-2 justify-center">
              <span className="text-3xl">{getFlagEmoji(favoriteOrigin)}</span>
              <span>{favoriteOrigin}</span>
            </span>
          </div>
        </div>

        {/* Top 3 Origins Icons Row */}
        {topOrigins.length > 0 && (
          <div className="flex justify-center gap-10">
            {topOrigins.slice(0, 3).map(({ origin, count }) => (
              <div key={origin} className="flex items-center gap-3 text-lg font-bold bg-white/[0.02] border border-white/5 px-6 py-3 rounded-xl">
                <span className="text-2xl">{getFlagEmoji(origin)}</span>
                <span>{origin}</span>
                <span className="text-sm text-[#D4AF37] font-extrabold">x{count}</span>
              </div>
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="flex flex-col items-center text-center pt-8 border-t border-white/5">
          <span className="text-sm text-white/20 font-bold tracking-[0.3em] uppercase">
            coffeede.x
          </span>
        </div>
      </div>
    </div>
  );
}
