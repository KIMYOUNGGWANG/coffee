import Link from "next/link";
import { Coffee, Sparkles, ChevronRight, Share2, Layers, BookOpen, Heart } from "lucide-react";
import LandingPricingSection from "@/components/landing-pricing-section";
import LandingPlaygroundClient from "@/components/landing-playground-client";
import LegalFooterLinks from "@/components/legal-footer-links";
import { LandingFeatures } from "@/components/landing-features";
import { buttonVariants } from "@/components/ui/button";
import { coffeeDexBrand } from "@/lib/brand";
import { cn } from "@/lib/utils";

export default function CoffeeDexHomePage() {
  return (
    <main className="min-h-screen overflow-x-clip text-[#F5F5F5] bg-black p-4 md:p-10 selection:bg-[#D4AF37]/20 relative">
      {/* Background ambient glow */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-[#D4AF37]/5 blur-[150px] pointer-events-none rounded-full" />
      
      <div className="max-w-7xl mx-auto space-y-16 relative z-10">

        {/* Navigation bar with ultra-dark glass background */}
        <header className="flex w-full min-w-0 items-center justify-between gap-3 rounded-full border border-white/5 bg-[#0A0A0A]/80 px-5 py-4 shadow-2xl backdrop-blur-2xl sm:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#D4AF37] to-[#A68A2B] flex items-center justify-center text-black shadow-lg">
              <Coffee size={18} strokeWidth={2} />
            </div>
            <span className="font-serif font-extrabold text-lg tracking-wide">{coffeeDexBrand.name}</span>
          </div>

          <div className="flex items-center gap-6">
            <Link className="hidden text-sm font-medium text-[#F5F5F5]/50 transition-colors hover:text-[#F5F5F5] md:inline-flex tracking-wide" href="/onboarding">
              온보딩 가이드
            </Link>
            <Link className={cn(buttonVariants({ size: "sm" }), "shrink-0 bg-[#D4AF37] hover:bg-[#C58948] border-none text-black rounded-full text-xs font-bold transition-all shadow-[0_0_15px_rgba(212,175,55,0.3)] hover:shadow-[0_0_25px_rgba(212,175,55,0.5)] cursor-pointer px-5 py-4")} href="/onboarding">
              Taste Finder 시작
            </Link>
          </div>
        </header>

        {/* Hero split section */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center pt-8">

          {/* Hero text panel (6 columns) */}
          <div className="lg:col-span-7 space-y-8 text-left pr-0 lg:pr-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#D4AF37]/5 border border-[#D4AF37]/20 text-[#D4AF37] text-[11px] font-extrabold uppercase tracking-[0.2em] shadow-inner backdrop-blur-sm">
              <Sparkles size={12} />
              Korea-first Specialty Coffee Memory
            </div>

            <h1 className="max-w-full break-keep font-serif text-[clamp(2.5rem,7vw,4.5rem)] font-extrabold leading-[1.1] text-[#F5F5F5]">
              한국 스페셜티 커피를 <br />
              <span className="text-[#D4AF37] italic font-light tracking-tight">나만의 맛 여권으로,</span> <br />
              {coffeeDexBrand.name}.
            </h1>

            <p className="text-sm md:text-lg text-[#F5F5F5]/60 leading-relaxed max-w-xl font-light">
              다시 사고 싶은 커피를 기억할 수 있도록, 마신 원두의 라벨을 AI로 스캔하여 Taste Passport에 스탬프를 적립해 보세요. 당신의 커피 취향을 정밀하게 분석합니다.
            </p>

            <div className="flex flex-wrap gap-4 pt-4">
              <Link
                className={cn(
                  buttonVariants({ size: "default" }),
                  "bg-[#D4AF37] hover:bg-[#C58948] border-none text-black font-extrabold rounded-full transition-all shadow-[0_8px_30px_rgba(212,175,55,0.25)] hover:shadow-[0_12px_40px_rgba(212,175,55,0.4)] hover:-translate-y-1 cursor-pointer flex items-center gap-2 text-sm px-8 py-6"
                )}
                href="/capture"
              >
                첫 테이스팅 기록 시작
                <ChevronRight size={18} />
              </Link>
              <Link
                className={cn(
                  buttonVariants({ variant: "outline", size: "default" }),
                  "border-white/10 bg-white/5 backdrop-blur-md text-[#F5F5F5]/80 hover:bg-white/10 hover:text-white font-bold rounded-full transition-all cursor-pointer text-sm px-8 py-6 hover:-translate-y-1"
                )}
                href="/onboarding"
              >
                30초 Taste Finder로 시작
              </Link>
            </div>
          </div>

          {/* Hero visual panel with 3D levitation frame (5 columns) */}
          <div className="lg:col-span-5 flex justify-center animate-in fade-in slide-in-from-right-8 duration-700 delay-150 perspective-1000">
            <div className="relative w-full max-w-[420px] aspect-[3/4] rounded-[2rem] transition-all duration-700 hover:rotate-0" style={{ transform: "rotateY(-10deg) rotateX(5deg) scale(0.95)" }}>
              {/* Premium Glow Behind Image */}
              <div className="absolute inset-0 bg-[#D4AF37]/20 blur-[80px] -z-10 rounded-full" />
              
              <div className="w-full h-full rounded-[2rem] overflow-hidden border border-white/10 bg-[#0A0A0A] shadow-[0_30px_60px_rgba(0,0,0,0.8)] relative group">
                <div className="absolute inset-0 bg-gradient-to-tr from-black/80 via-transparent to-white/5 pointer-events-none z-10" />
                
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/images/premium_coffee_brewing.png"
                  alt="Aesthetic coffee brewing setup"
                  className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-1000 ease-out"
                />
                
                {/* Floating Detail Card */}
                <div className="absolute bottom-6 left-6 right-6 flex items-center gap-4 rounded-2xl border border-white/10 bg-[#0A0A0A]/80 px-5 py-4 shadow-2xl backdrop-blur-xl z-20 translate-y-2 group-hover:translate-y-0 transition-transform duration-500">
                  <div className="w-10 h-10 rounded-xl bg-[#D4AF37]/10 border border-[#D4AF37]/20 flex items-center justify-center text-[#D4AF37]">
                    <Coffee size={18} />
                  </div>
                  <div className="text-left flex-1 min-w-0">
                    <p className="text-[10px] uppercase font-bold text-[#D4AF37] tracking-[0.15em] leading-none mb-1">오늘의 원두</p>
                    <p className="text-sm font-serif font-bold text-white truncate">Fritz Ethiopia Sidama</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </section>

        {/* Feature section in minimal grid format */}
        <section className="space-y-12 pt-16 border-t border-white/5">
          <div className="text-center max-w-2xl mx-auto space-y-4">
            <span className="text-[10px] uppercase font-bold tracking-[0.2em] text-[#D4AF37]">
              경험의 확장
            </span>
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-[#F5F5F5]">디지털 진열장에 쌓이는 미각 아카이브</h2>
            <p className="text-sm text-[#F5F5F5]/50 leading-relaxed font-light">
              단순한 기록을 넘어, 소장하고 싶은 포트폴리오를 만들어 드립니다.
            </p>
          </div>

          <LandingFeatures />
        </section>

        <div className="mx-auto w-full max-w-7xl py-12">
          <LandingPlaygroundClient />
        </div>

        <LandingPricingSection />

        {/* Current product boundary section - redesigned */}
        <section className="rounded-[2.5rem] border border-[#D4AF37]/20 bg-gradient-to-b from-[#111111] to-[#0A0A0A] p-8 md:p-12 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#D4AF37]/5 blur-[100px] rounded-full pointer-events-none" />
          
          <div className="flex flex-col md:flex-row justify-between items-start gap-6 border-b border-white/5 pb-8 relative z-10">
            <div className="max-w-xl">
              <h2 className="font-serif text-2xl font-bold text-white mb-2">오늘 제공하는 CoffeeDex 결과물</h2>
              <p className="text-sm font-light leading-relaxed text-[#F5F5F5]/50">
                현재 범위는 개인 기록, AI 보조 스캔/노트, 디지털 공유와 PDF 내보내기입니다.
              </p>
            </div>
            <span className="inline-flex items-center gap-2 rounded-full border border-[#D4AF37]/20 bg-[#D4AF37]/10 px-4 py-2 text-xs font-bold text-[#D4AF37] tracking-widest uppercase">
              <BookOpen size={14} />
              Tasting archive
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 pt-8 relative z-10">
            {["Taste Passport", "AI Draft", "Rebuy Memory", "Story Export"].map((tag, idx) => (
              <div key={idx} className="flex flex-col space-y-4">
                <span className="text-[10px] uppercase font-bold tracking-wider text-[#D4AF37]">/ {tag}</span>
                <div className="h-px w-8 bg-[#D4AF37]/30" />
                <h4 className="text-base font-bold text-white">
                  {idx === 0 ? "맛 여권 스탬프 적립" : idx === 1 ? "원두 라벨 스캔 초안" : idx === 2 ? "재구매 기억과 다음 행동" : "공유용 스토리 카드"}
                </h4>
                <p className="text-xs text-[#F5F5F5]/50 font-light leading-relaxed">
                  {idx === 0 ? "원두명, 로스터리, 산지, 가공 방식, 그리고 컵 노트를 디지털 여권 스탬프로 기록" :
                   idx === 1 ? "패키지 사진에서 읽은 정보를 자동 완성 후보로 제안하고 저장 전 사용자가 수정" :
                   idx === 2 ? "좋았던 이유, 남은 원두, 구매 단서를 바탕으로 다시 살 타이밍을 정리" :
                   "내가 저장한 원두와 컵 노트를 SNS에 올리기 좋은 이미지 아티팩트로 다운로드"}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Footer info area */}
        <footer className="w-full bg-[#0A0A0A] border-t border-white/5 py-8 flex flex-col md:flex-row justify-between items-center gap-6 text-xs text-[#F5F5F5]/40 mt-24">
          <div className="flex items-center gap-2 font-serif">
            <Layers size={14} className="text-[#D4AF37]" />
            <span>CoffeeDex © {new Date().getFullYear()}</span>
          </div>

          <LegalFooterLinks />
        </footer>
      </div>
    </main>
  );
}
