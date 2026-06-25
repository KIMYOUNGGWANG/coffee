"use client";

import React from "react";
import { Sparkles, Layers, Heart, Share2 } from "lucide-react";
import { TiltCard } from "@/components/ui/tilt-card";

export function LandingFeatures() {
  const features = [
    {
      icon: <Sparkles size={20} />,
      title: "디지털 여권",
      desc: "마신 원두의 정보를 수집하여 국가별 스탬프와 함께 Taste Passport를 채워나갑니다."
    },
    {
      icon: <Layers size={20} />,
      title: "AI 향미 노트",
      desc: "단순한 메모를 바탕으로 전문가 수준의 SCA 스타일 컵 노트 초안을 제안합니다."
    },
    {
      icon: <Heart size={20} />,
      title: "취향 분석",
      desc: "적립된 스탬프 데이터를 바탕으로 개인의 커피 스타일을 정밀하게 분석합니다."
    },
    {
      icon: <Share2 size={20} />,
      title: "SNS 아티팩트",
      desc: "가장 빛나는 한 잔의 기록을 인스타그램 스토리에 완벽한 비율로 내보냅니다."
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {features.map((feature, idx) => (
        <TiltCard key={idx} className="h-full rounded-3xl" glowColor="rgba(212, 175, 55, 0.2)">
          <div className="bg-[#0A0A0A]/80 backdrop-blur-xl border border-white/5 rounded-3xl p-8 hover:border-[#D4AF37]/40 hover:bg-[#111111]/90 transition-all duration-500 group flex flex-col items-start gap-5 h-full shadow-[0_8px_30px_rgba(0,0,0,0.4)]">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#D4AF37]/10 to-transparent border border-[#D4AF37]/20 flex items-center justify-center text-[#D4AF37] group-hover:scale-110 transition-transform duration-500 shadow-inner">
              {feature.icon}
            </div>
            <div className="space-y-2">
              <h3 className="font-serif font-bold text-lg text-[#F5F5F5]">{feature.title}</h3>
              <p className="text-xs text-[#F5F5F5]/60 leading-relaxed font-light">
                {feature.desc}
              </p>
            </div>
          </div>
        </TiltCard>
      ))}
    </div>
  );
}
