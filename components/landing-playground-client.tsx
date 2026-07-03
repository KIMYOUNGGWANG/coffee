"use client";

import React, { useState, useEffect } from "react";
import { Sparkles, Coffee, ArrowRight, Layers, Heart, Droplets } from "lucide-react";
import Link from "next/link";

type SampleCoffee = {
  id: string;
  title: string;
  roaster: string;
  image: string;
  tags: string[];
  metrics: { acidity: number; sweetness: number; body: number };
  aiDescription: string;
};

const samples: SampleCoffee[] = [
  {
    id: "aricha",
    title: "에티오피아 예가체프 아리차 내추럴",
    roaster: "모모스 커피 (Momos Coffee)",
    image: "/images/premium_coffee_brewing.png", // fallback aesthetic image
    tags: ["Peach", "Jasmine", "Honey", "Citrus"],
    metrics: { acidity: 4, sweetness: 4, body: 2 },
    aiDescription: "잘 익은 백도와 향긋한 재스민 아로마가 은은한 꿀의 단맛과 섞여 부드러운 산미로 피어나는 싱그러운 컵.",
  },
  {
    id: "purple-caturra",
    title: "콜롬비아 몬테블랑코 퍼플 카투라 무산소",
    roaster: "프릳츠 커피 (Fritz Coffee)",
    image: "/images/premium_coffee_brewing.png",
    tags: ["Berry", "Chocolate", "Caramel", "Apple"],
    metrics: { acidity: 3, sweetness: 5, body: 4 },
    aiDescription: "무산소 발효 특유의 짙은 베리 아로마와 부드러운 초콜릿 피니시, 묵직하고 꽉 찬 단맛의 뛰어난 밸런스.",
  },
];

const loadingStages = [
  "원두 패키지 라벨 텍스트 스캔 중...",
  "그린 빈 원산지 및 품종 감지 중...",
  "가공 방식과 최적 로스팅 정보 추출 중...",
  "SCA 향미 플레이버 휠 매칭 중...",
  "향미 컵 노트 한줄평 초안 작성 완료",
];

export default function LandingPlaygroundClient() {
  const [selectedSample, setSelectedSample] = useState<SampleCoffee | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanStep, setScanStep] = useState(0);
  const [resultCard, setResultCard] = useState<SampleCoffee | null>(null);

  const startScan = (sample: SampleCoffee) => {
    if (isScanning) return;
    setSelectedSample(sample);
    setIsScanning(true);
    setScanStep(0);
    setResultCard(null);
  };

  useEffect(() => {
    if (!isScanning) return;

    const interval = setInterval(() => {
      setScanStep((prev) => {
        if (prev >= loadingStages.length - 1) {
          clearInterval(interval);
          setTimeout(() => {
            setIsScanning(false);
            setResultCard(selectedSample);
          }, 300);
          return prev;
        }
        return prev + 1;
      });
    }, 550);

    return () => clearInterval(interval);
  }, [isScanning, selectedSample]);

  return (
    <div className="rounded-3xl border border-white/10 bg-[#120f0c]/78 p-5 shadow-[0_24px_70px_rgba(0,0,0,0.3)] space-y-6 sm:p-6 md:p-8">
      <div className="flex items-center gap-2">
        <Sparkles size={14} className="text-primary-amber" />
        <span className="text-[10px] font-black uppercase tracking-[0.24em] text-muted-foreground">
          AI 즉석 체험 플레이그라운드
        </span>
      </div>

      <div className="space-y-2">
        <h3 className="break-keep font-serif text-2xl font-black leading-tight text-foreground sm:text-3xl">
          CoffeeDex 컵 노트를 지금 직접 테스트해 보세요
        </h3>
        <p className="max-w-3xl break-keep text-sm text-foreground/68 font-semibold leading-6">
          아래 샘플 원두 패키지 중 하나를 클릭하면, CoffeeDex가 원두 라벨에서 읽을 수 있는 단서를 바탕으로
          저장 전 검토할 수 있는 향미 기록 초안을 가상 시뮬레이션으로 완성합니다.
        </p>
      </div>

      {/* 샘플 패키지 카드들 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {samples.map((sample) => (
          <button
            key={sample.id}
            onClick={() => startScan(sample)}
            disabled={isScanning}
            className={`group flex min-h-44 flex-col justify-between rounded-2xl border p-4 text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-amber disabled:cursor-wait disabled:opacity-80 ${
              selectedSample?.id === sample.id && (isScanning || resultCard)
                ? "border-primary-amber/70 bg-[#f6efe3] text-[#241a14] shadow-[0_18px_42px_rgba(217,160,91,0.18)]"
                : "border-white/10 bg-white/[0.035] text-foreground hover:border-primary-amber/42 hover:bg-[#211b16]"
            }`}
          >
            <div>
              <span className={`text-[10px] font-bold uppercase tracking-widest block mb-1 ${selectedSample?.id === sample.id && (isScanning || resultCard) ? "text-[#9f6a4a]" : "text-primary-amber"}`}>
                {sample.roaster}
              </span>
              <h4 className="break-keep font-serif font-black text-base leading-snug">
                {sample.title}
              </h4>
              <div className="flex flex-wrap gap-1 mt-2.5">
                {sample.tags.map((t) => (
                  <span key={t} className={`rounded-full border px-2 py-1 text-[10px] font-bold ${selectedSample?.id === sample.id && (isScanning || resultCard) ? "border-[#9f6a4a]/24 bg-[#9f6a4a]/10 text-[#6d442f]" : "border-white/10 bg-white/[0.06] text-foreground/78 group-hover:text-foreground"}`}>
                    #{t}
                  </span>
                ))}
              </div>
            </div>

            <div className={`mt-4 flex w-full items-center justify-between border-t pt-3 text-[10px] font-black uppercase ${selectedSample?.id === sample.id && (isScanning || resultCard) ? "border-[#9f6a4a]/18 text-[#6d442f]" : "border-white/10 text-foreground/62"}`}>
              <span>스캔 분석 시작하기</span>
              <ArrowRight size={12} className="text-primary-amber" />
            </div>
          </button>
        ))}
      </div>

      {/* 분석 중 화면 */}
      {isScanning && (
        <div className="rounded-2xl bg-black/80 text-foreground p-6 border border-white/10 text-center space-y-4 animate-in fade-in zoom-in-95 duration-200">
          <div className="flex justify-center">
            <span className="animate-spin grid size-10 place-items-center border-t border-r border-primary-amber rounded-full">
              <Coffee size={18} className="text-primary-amber" />
            </span>
          </div>
          <div className="space-y-1">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-primary-amber">
              AI SCANNER RUNNING
            </p>
            <p className="font-serif text-sm italic transition-all duration-300">
              {loadingStages[scanStep]}
            </p>
          </div>
          <div className="h-1 bg-white/10 w-48 mx-auto rounded-full overflow-hidden">
            <div
              className="h-full bg-primary-amber transition-all duration-500"
              style={{ width: `${((scanStep + 1) / loadingStages.length) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* 분석 완료 카드 결과 화면 */}
      {resultCard && !isScanning && (
        <div className="rounded-2xl border border-primary-amber/30 bg-white/[0.04] p-5 shadow-xl space-y-4 animate-in slide-in-from-bottom-4 duration-300">
          <div className="flex flex-col gap-3 border-b border-white/10 pb-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <span className="text-[10px] font-bold text-primary-amber uppercase tracking-widest">
                AI SCAN RESULT CARD
              </span>
              <h4 className="break-keep font-serif font-black text-lg leading-tight text-foreground mt-1">
                {resultCard.title}
              </h4>
              <p className="text-xs font-semibold text-foreground/60">{resultCard.roaster}</p>
            </div>
            <span className="bg-primary-amber/10 border border-primary-amber/30 text-primary-amber text-[9px] px-2 py-0.5 font-bold rounded-full">
              Confidence 98%
            </span>
          </div>

          {/* 슬라이더 점수 */}
          <div className="grid grid-cols-3 gap-2">
            <div className="rounded-xl bg-black/20 border border-white/10 p-2.5 text-center">
              <span className="text-[9px] font-bold text-foreground/45 uppercase tracking-wider block">Acidity</span>
              <span className="font-serif text-xl font-black text-foreground mt-1 block">{resultCard.metrics.acidity} / 5</span>
            </div>
            <div className="rounded-xl bg-black/20 border border-white/10 p-2.5 text-center">
              <span className="text-[9px] font-bold text-foreground/45 uppercase tracking-wider block">Sweetness</span>
              <span className="font-serif text-xl font-black text-foreground mt-1 block">{resultCard.metrics.sweetness} / 5</span>
            </div>
            <div className="rounded-xl bg-black/20 border border-white/10 p-2.5 text-center">
              <span className="text-[9px] font-bold text-foreground/45 uppercase tracking-wider block">Body</span>
              <span className="font-serif text-xl font-black text-foreground mt-1 block">{resultCard.metrics.body} / 5</span>
            </div>
          </div>

          {/* AI Description */}
          <div className="bg-white/5 border border-white/10 p-4 rounded-xl relative">
            <span className="absolute -top-2 left-3 bg-black/80 px-2 text-[9px] font-bold text-primary-amber border border-white/10 rounded-full flex items-center gap-1">
              <Sparkles size={8} />
              Flavor Note Draft
            </span>
            <p className="font-serif text-xs italic text-foreground/90 leading-relaxed pt-1">
              “{resultCard.aiDescription}”
            </p>
          </div>

          {/* CTA Link */}
          <div className="grid gap-3 pt-2 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
            <span className="break-keep text-[11px] text-foreground/58 font-semibold leading-5">
              지금 바로 회원가입하고 나만의 홈카페를 기록해 보세요.
            </span>
            <Link
              href="/onboarding"
              className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-xl bg-primary-amber px-3.5 py-2 text-xs font-bold text-[#0D0A07] transition-all hover:opacity-90"
            >
              <span>Taste Finder로 가입하기</span>
              <ArrowRight size={11} />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
