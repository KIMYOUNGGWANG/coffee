"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import { Coffee, Sparkles } from "lucide-react";

const LandingPlaygroundClient = dynamic(() => import("@/components/landing-playground-client"), {
  loading: () => <LandingPlaygroundPlaceholder />,
});

function LandingPlaygroundPlaceholder() {
  return (
    <div className="space-y-6 rounded-3xl border border-white/10 bg-[#120f0c]/78 p-5 shadow-[0_24px_70px_rgba(0,0,0,0.3)] sm:p-6 md:p-8">
      <div className="flex items-center gap-2">
        <Sparkles size={14} className="text-primary-amber" />
        <span className="text-[10px] font-black uppercase tracking-[0.24em] text-muted-foreground">
          향미 기록 미리보기
        </span>
      </div>
      <div className="space-y-2">
        <h3 className="break-keep font-serif text-2xl font-black leading-tight text-foreground sm:text-3xl">
          CoffeeDex 컵 노트를 지금 직접 테스트해 보세요
        </h3>
        <p className="max-w-3xl break-keep text-sm font-semibold leading-6 text-foreground/68">
          샘플 원두 패키지로 저장 전 검토할 수 있는 향미 기록 초안을 확인할 수 있습니다.
        </p>
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {["에티오피아 예가체프 아리차", "콜롬비아 퍼플 카투라"].map((title) => (
          <div
            key={title}
            className="flex min-h-44 flex-col justify-between rounded-2xl border border-white/10 bg-white/[0.035] p-4 text-left"
          >
            <div>
              <span className="mb-1 block text-[10px] font-bold uppercase tracking-widest text-primary-amber">
                샘플 원두
              </span>
              <h4 className="break-keep font-serif text-base font-black leading-snug">{title}</h4>
            </div>
            <div className="mt-4 flex w-full items-center justify-between border-t border-white/10 pt-3 text-[10px] font-black uppercase text-foreground/62">
              <span>근처에서 준비 중</span>
              <Coffee size={12} className="text-primary-amber" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function LandingPlaygroundLazy() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [shouldMount, setShouldMount] = useState(false);

  useEffect(() => {
    const element = containerRef.current;
    if (!element || shouldMount) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        setShouldMount(true);
        observer.disconnect();
      },
      { rootMargin: "900px 0px", threshold: 0.01 },
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [shouldMount]);

  return (
    <div ref={containerRef}>
      {shouldMount ? <LandingPlaygroundClient /> : <LandingPlaygroundPlaceholder />}
    </div>
  );
}
