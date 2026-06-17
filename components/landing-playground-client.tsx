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
  "AI 감성 컵 노트 한줄평 작성 완료!",
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
    <div className="border border-espresso bg-[#fffaf2] p-6 md:p-8 shadow-[6px_6px_0_rgba(47,37,31,0.1)] rounded-none space-y-6">
      <div className="flex items-center gap-2">
        <Sparkles size={14} className="text-caramel" />
        <span className="text-[10px] font-black uppercase tracking-[0.24em] text-[#7b4d34]">
          AI 즉석 체험 플레이그라운드
        </span>
      </div>

      <div className="space-y-2">
        <h3 className="font-serif text-2xl font-black text-espresso">
          향미 AI 컵 노트를 지금 직접 테스트해 보세요
        </h3>
        <p className="text-xs text-espresso/60 font-semibold leading-relaxed">
          아래 샘플 원두 패키지 중 하나를 클릭하면, 향미만의 Gemini Vision 기술이 원두 라벨을 인식하고
          SCA 표준 아로마 휠에 맞춘 분석 결과 카드를 3초 안에 가상 시뮬레이션으로 완성합니다.
        </p>
      </div>

      {/* 샘플 패키지 카드들 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {samples.map((sample) => (
          <button
            key={sample.id}
            onClick={() => startScan(sample)}
            disabled={isScanning}
            className={`text-left p-4 border rounded-none transition-all flex flex-col justify-between h-40 ${
              selectedSample?.id === sample.id && (isScanning || resultCard)
                ? "border-caramel bg-caramel/5 ring-1 ring-caramel"
                : "border-espresso/20 bg-white/60 hover:border-espresso hover:bg-white"
            }`}
          >
            <div>
              <span className="text-[10px] font-bold text-caramel uppercase tracking-widest block mb-1">
                {sample.roaster}
              </span>
              <h4 className="font-serif font-black text-sm text-espresso leading-snug">
                {sample.title}
              </h4>
              <div className="flex flex-wrap gap-1 mt-2.5">
                {sample.tags.map((t) => (
                  <span key={t} className="text-[9px] bg-white border border-espresso/15 px-1.5 py-0.5 font-semibold">
                    #{t}
                  </span>
                ))}
              </div>
            </div>

            <div className="flex justify-between items-center mt-3 pt-2 border-t border-espresso/10 w-full text-[10px] font-black uppercase text-espresso/60">
              <span>스캔 분석 시작하기</span>
              <ArrowRight size={12} className="text-caramel" />
            </div>
          </button>
        ))}
      </div>

      {/* 분석 중 화면 */}
      {isScanning && (
        <div className="bg-[#2f251f] text-cream p-6 border border-espresso text-center space-y-4 animate-in fade-in zoom-in-95 duration-200">
          <div className="flex justify-center">
            <span className="animate-spin grid size-10 place-items-center border-t border-r border-[#e1b698] rounded-full">
              <Coffee size={18} className="text-[#e1b698]" />
            </span>
          </div>
          <div className="space-y-1">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-[#e1b698]">
              AI SCANNER RUNNING
            </p>
            <p className="font-serif text-sm italic transition-all duration-300">
              {loadingStages[scanStep]}
            </p>
          </div>
          <div className="h-1 bg-white/10 w-48 mx-auto rounded-full overflow-hidden">
            <div
              className="h-full bg-caramel transition-all duration-500"
              style={{ width: `${((scanStep + 1) / loadingStages.length) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* 분석 완료 카드 결과 화면 */}
      {resultCard && !isScanning && (
        <div className="border border-caramel bg-white p-5 shadow-[4px_4px_0_rgba(159,106,74,0.12)] space-y-4 animate-in slide-in-from-bottom-4 duration-300">
          <div className="flex justify-between items-start border-b border-espresso/10 pb-3">
            <div>
              <span className="text-[10px] font-bold text-caramel uppercase tracking-widest">
                AI SCAN RESULT CARD
              </span>
              <h4 className="font-serif font-black text-lg text-espresso mt-1">
                {resultCard.title}
              </h4>
              <p className="text-xs font-semibold text-espresso/60">{resultCard.roaster}</p>
            </div>
            <span className="bg-caramel/10 border border-caramel/30 text-caramel text-[9px] px-2 py-0.5 font-bold rounded-full">
              Confidence 98%
            </span>
          </div>

          {/* 슬라이더 점수 */}
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-[#fffaf2] border border-espresso/10 p-2.5 text-center">
              <span className="text-[9px] font-bold text-espresso/45 uppercase tracking-wider block">Acidity</span>
              <span className="font-serif text-xl font-black text-espresso mt-1 block">{resultCard.metrics.acidity} / 5</span>
            </div>
            <div className="bg-[#fffaf2] border border-espresso/10 p-2.5 text-center">
              <span className="text-[9px] font-bold text-espresso/45 uppercase tracking-wider block">Sweetness</span>
              <span className="font-serif text-xl font-black text-espresso mt-1 block">{resultCard.metrics.sweetness} / 5</span>
            </div>
            <div className="bg-[#fffaf2] border border-espresso/10 p-2.5 text-center">
              <span className="text-[9px] font-bold text-espresso/45 uppercase tracking-wider block">Body</span>
              <span className="font-serif text-xl font-black text-espresso mt-1 block">{resultCard.metrics.body} / 5</span>
            </div>
          </div>

          {/* AI Description */}
          <div className="bg-cream/40 border border-warm-gray/60 p-4 rounded-xl relative">
            <span className="absolute -top-2 left-3 bg-white px-2 text-[9px] font-bold text-caramel border border-warm-gray/60 rounded-full flex items-center gap-1">
              <Sparkles size={8} />
              AI Cup Note
            </span>
            <p className="font-serif text-xs italic text-espresso/90 leading-relaxed pt-1">
              “{resultCard.aiDescription}”
            </p>
          </div>

          {/* CTA Link */}
          <div className="flex justify-between items-center pt-2">
            <span className="text-[10px] text-espresso/50 font-semibold">
              지금 바로 회원가입하고 나만의 홈카페를 기록해 보세요.
            </span>
            <Link
              href="/onboarding"
              className="px-3.5 py-2 bg-espresso hover:bg-espresso/90 text-white font-bold text-xs flex items-center gap-1.5 transition-all"
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
