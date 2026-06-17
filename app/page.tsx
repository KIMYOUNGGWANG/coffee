import Link from "next/link";
import { Coffee, Sparkles, ChevronRight, Share2, Layers, BookOpen, Heart } from "lucide-react";
import LandingPricingSection from "@/components/landing-pricing-section";
import LandingPlaygroundClient from "@/components/landing-playground-client";
import LegalFooterLinks from "@/components/legal-footer-links";
import { buttonVariants } from "@/components/ui/button";
import { hyangmiBrand } from "@/lib/brand";
import { cn } from "@/lib/utils";

export default function HyangmiHomePage() {
  return (
    <main className="min-h-screen bg-gradient-to-tr from-[#f4f2ec] via-[#faf9f5] to-[#eceae2] text-espresso p-4 md:p-10 selection:bg-caramel/20">
      <div className="max-w-7xl mx-auto space-y-10">

        {/* Navigation bar with soft glass background */}
        <header className="w-full bg-white/30 backdrop-blur-md border border-white/40 rounded-3xl px-6 py-4 flex justify-between items-center shadow-sm">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-caramel flex items-center justify-center text-cream shadow-sm">
              <Coffee size={16} strokeWidth={2} />
            </div>
            <span className="font-serif font-extrabold text-base tracking-tight">{hyangmiBrand.name}</span>
          </div>

          <div className="flex items-center gap-4">
            <Link className="text-xs font-semibold text-espresso/60 hover:text-espresso transition-colors" href="/onboarding">
              온보딩 가이드
            </Link>
            <Link className={cn(buttonVariants({ size: "sm" }), "bg-espresso hover:bg-espresso/90 text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer")} href="/onboarding">
              Taste Finder 시작
            </Link>
          </div>
        </header>

        {/* Hero split section */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center pt-2">

          {/* Hero text panel (6 columns) */}
          <div className="lg:col-span-7 space-y-6 text-left pr-0 lg:pr-8 animate-in fade-in slide-in-from-left-6 duration-500">
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-caramel/10 border border-caramel/20 text-caramel text-[10px] font-extrabold uppercase tracking-widest shadow-inner">
              <Sparkles size={11} />
              Korea-first Specialty Coffee Memory
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-serif font-extrabold text-espresso leading-[1.15]">
              한국 스페셜티 커피를 <br />
              <span className="text-caramel italic font-light">나만의 맛 여권(Taste Passport)</span>으로, <br />
              {hyangmiBrand.name}.
            </h1>

            <p className="text-sm md:text-base text-espresso/70 leading-relaxed max-w-xl font-medium">
              마신 원두의 라벨을 AI로 간편하게 스캔하여 나의 Taste Passport에 스탬프를 적립해 보세요. 내 커피 취향을 정밀 분석하고 매주 신선한 마이크로 로스터리의 원두를 추천합니다.
            </p>


            <div className="flex flex-wrap gap-3.5 pt-2">
              <Link
                className={cn(
                  buttonVariants({ size: "default" }),
                  "bg-espresso hover:bg-espresso/90 text-white font-extrabold py-3.5 px-7 rounded-2xl transition-all shadow-md active:scale-95 cursor-pointer flex items-center gap-1.5 text-sm"
                )}
                href="/dashboard"
              >
                첫 테이스팅 기록 시작
                <ChevronRight size={16} />
              </Link>
              <Link
                className={cn(
                  buttonVariants({ variant: "outline", size: "default" }),
                  "border-espresso/15 bg-white/20 backdrop-blur-sm text-espresso/80 hover:bg-white/40 font-bold py-3.5 px-7 rounded-2xl transition-all cursor-pointer text-sm"
                )}
                href="/onboarding"
              >
                30초 Taste Finder로 시작
              </Link>
            </div>
          </div>

          {/* Hero visual panel with magazine frame (5 columns) */}
          <div className="lg:col-span-5 flex justify-center animate-in fade-in slide-in-from-right-6 duration-500">
            <div className="relative aspect-[3/4] w-full max-w-[380px] bg-cream border border-warm-gray rounded-3xl p-4 shadow-[0_25px_50px_rgba(25,20,15,0.08)] hover:shadow-[0_30px_60px_rgba(25,20,15,0.12)] transition-all duration-300 rotate-1 hover:rotate-0">
              {/* Paper overlay texture */}
              <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent pointer-events-none rounded-3xl" />

              {/* 3:4 high fidelity image container */}
              <div className="w-full h-full rounded-2xl overflow-hidden border border-warm-gray bg-white shadow-inner relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/images/premium_coffee_brewing.png"
                  alt="Aesthetic coffee brewing setup"
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Float tag overlay */}
              <div className="absolute -bottom-4 -left-4 bg-white border border-warm-gray px-4 py-2.5 rounded-2xl shadow-lg flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-caramel/10 flex items-center justify-center text-caramel">
                  <Coffee size={14} />
                </div>
                <div className="text-left">
                  <p className="text-[10px] uppercase font-bold text-caramel tracking-wider leading-none">오늘의 원두</p>
                  <p className="text-xs font-serif font-bold leading-tight mt-0.5">Fritz Ethiopia Sidama</p>
                </div>
              </div>
            </div>
          </div>

        </section>

        {/* Feature section in beautiful grid format */}
        <section className="space-y-6 pt-6">
          <div className="text-center max-w-xl mx-auto space-y-2">
            <span className="text-[9px] uppercase font-extrabold tracking-widest text-caramel bg-caramel/10 border border-caramel/20 px-3 py-1 rounded-full">
              기록 범위
            </span>
            <h2 className="text-2xl md:text-3xl font-serif font-bold">한국 홈카페 기록이 쌓이는 4가지 경험</h2>
            <p className="text-xs text-espresso/60 leading-relaxed">
              오늘 제공하는 것은 개인 테이스팅 아카이브, AI 보조 초안, 공유/내보내기 결과물입니다.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            {/* Card 1 */}
            <div className="bg-white/40 backdrop-blur-md border border-white/60 rounded-3xl p-6 hover:shadow-[0_15px_30px_rgba(25,20,15,0.03)] hover:-translate-y-1 transition-all duration-300 flex items-start gap-4">
              <div className="w-10 h-10 rounded-2xl bg-cream border border-warm-gray flex items-center justify-center text-caramel shrink-0 shadow-sm">
                <Sparkles size={18} />
              </div>
              <div className="space-y-1.5 text-left">
                <h3 className="font-serif font-bold text-base">01. 한국 카페 테이스팅 카드 (맛 여권)</h3>
                <p className="text-xs text-espresso/70 leading-relaxed">
                  마신 원두의 정보를 수집하여 에티오피아, 콜롬비아 등 나만의 디지털 맛 여권(Taste Passport) 스탬프로 채워나갑니다.
                </p>
              </div>
            </div>

            {/* Card 2 */}
            <div className="bg-white/40 backdrop-blur-md border border-white/60 rounded-3xl p-6 hover:shadow-[0_15px_30px_rgba(25,20,15,0.03)] hover:-translate-y-1 transition-all duration-300 flex items-start gap-4">
              <div className="w-10 h-10 rounded-2xl bg-cream border border-warm-gray flex items-center justify-center text-caramel shrink-0 shadow-sm">
                <Layers size={18} />
              </div>
              <div className="space-y-1.5 text-left">
                <h3 className="font-serif font-bold text-base">02. AI 보조 테이스팅 초안</h3>
                <p className="text-xs text-espresso/70 leading-relaxed">
                  "귤 같은 산미, 꿀 단맛, 깨끗한 후미"처럼 짧게 적은 메모를 바탕으로 SCA 스타일 컵 노트 초안을 제안합니다.
                </p>
              </div>
            </div>

            {/* Card 3 */}
            <div className="bg-white/40 backdrop-blur-md border border-white/60 rounded-3xl p-6 hover:shadow-[0_15px_30px_rgba(25,20,15,0.03)] hover:-translate-y-1 transition-all duration-300 flex items-start gap-4">
              <div className="w-10 h-10 rounded-2xl bg-cream border border-warm-gray flex items-center justify-center text-caramel shrink-0 shadow-sm">
                <Heart size={18} />
              </div>
              <div className="space-y-1.5 text-left">
                <h3 className="font-serif font-bold text-base">03. 취향 분석과 로스터리 매칭</h3>
                <p className="text-xs text-espresso/70 leading-relaxed">
                  내가 기록한 카드들의 산미, 단맛, 바디감 점수를 기반으로 내 커피 스타일을 분석하고 최적의 로컬 원두 상품을 연결합니다.
                </p>
              </div>
            </div>

            {/* Card 4 */}
            <div className="bg-white/40 backdrop-blur-md border border-white/60 rounded-3xl p-6 hover:shadow-[0_15px_30px_rgba(25,20,15,0.03)] hover:-translate-y-1 transition-all duration-300 flex items-start gap-4">
              <div className="w-10 h-10 rounded-2xl bg-cream border border-warm-gray flex items-center justify-center text-caramel shrink-0 shadow-sm">
                <Share2 size={18} />
              </div>
              <div className="space-y-1.5 text-left">
                <h3 className="font-serif font-bold text-base">04. 소셜 스토리 공유 및 여권 내보내기</h3>
                <p className="text-xs text-espresso/70 leading-relaxed">
                  기록을 소셜 피드용 이미지나 나만의 커피 포트폴리오 PDF로 내려받을 수 있으며, 오늘의 결과물은 멋진 디지털 아티팩트입니다.
                </p>
              </div>
            </div>

          </div>
        </section>

        <div className="mx-auto max-w-7xl px-4 py-8 md:px-8">
        <LandingPlaygroundClient />
      </div>

      <LandingPricingSection />

        {/* Current product boundary section */}
        <section className="bg-white/30 backdrop-blur-md border border-white/40 rounded-3xl p-6 md:p-8 shadow-sm space-y-6">
          <div className="flex justify-between items-center pb-4 border-b border-warm-gray">
            <div className="text-left">
              <h2 className="text-lg font-serif font-bold">오늘 제공하는 Hyangmi 결과물</h2>
              <p className="text-[11px] text-espresso/50 mt-0.5">
                현재 범위는 개인 기록, AI 보조 스캔/노트, 디지털 공유와 PDF 내보내기입니다.
              </p>
            </div>
            <span className="badge text-[10px] font-bold py-1 px-2.5 flex items-center gap-1.5">
              <BookOpen size={12} className="text-espresso/60" />
              Tasting archive
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">

            <div className="bg-white border border-warm-gray rounded-2xl p-4 flex flex-col justify-between space-y-4 hover:border-caramel/30 transition-all duration-300 text-left">
              <div>
                <span className="text-[9px] uppercase font-bold tracking-wider text-caramel bg-caramel/10 px-2 py-0.5 rounded-full inline-block">Taste Passport</span>
                <h4 className="text-sm font-bold mt-2">맛 여권 스탬프 적립</h4>
                <p className="text-[10px] text-espresso/50 mt-1 leading-relaxed">원두명, 로스터리, 산지, 가공 방식, 그리고 컵 노트를 디지털 여권 스탬프로 기록 및 소장</p>
              </div>
              <span className="text-xs font-extrabold text-espresso mt-3 block">현재 제공</span>
            </div>

            <div className="bg-white border border-warm-gray rounded-2xl p-4 flex flex-col justify-between space-y-4 hover:border-caramel/30 transition-all duration-300 text-left">
              <div>
                <span className="text-[9px] uppercase font-bold tracking-wider text-caramel bg-caramel/10 px-2 py-0.5 rounded-full inline-block">AI Draft</span>
                <h4 className="text-sm font-bold mt-2">원두 라벨 스캔 초안</h4>
                <p className="text-[10px] text-espresso/50 mt-1 leading-relaxed">패키지 사진에서 읽은 정보를 자동 완성 후보로 제안하고 저장 전 사용자가 수정</p>
              </div>
              <span className="text-xs font-extrabold text-espresso mt-3 block">확인 후 저장</span>
            </div>

            <div className="bg-white border border-warm-gray rounded-2xl p-4 flex flex-col justify-between space-y-4 hover:border-caramel/30 transition-all duration-300 text-left">
              <div>
                <span className="text-[9px] uppercase font-bold tracking-wider text-caramel bg-caramel/10 px-2 py-0.5 rounded-full inline-block">Roaster Network</span>
                <h4 className="text-sm font-bold mt-2">취향 분석 & 원두 추천</h4>
                <p className="text-[10px] text-espresso/50 mt-1 leading-relaxed">내 취향 분석 결과에 맞추어 다양한 마이크로 로스터리의 원두 추천 및 편리한 앱 내 구매 제공</p>
              </div>
              <span className="text-xs font-extrabold text-espresso mt-3 block">매칭 연동</span>
            </div>

            <div className="bg-white border border-warm-gray rounded-2xl p-4 flex flex-col justify-between space-y-4 hover:border-caramel/30 transition-all duration-300 text-left">
              <div>
                <span className="text-[9px] uppercase font-bold tracking-wider text-caramel bg-caramel/10 px-2 py-0.5 rounded-full inline-block">Story Export</span>
                <h4 className="text-sm font-bold mt-2">공유용 스토리 카드</h4>
                <p className="text-[10px] text-espresso/50 mt-1 leading-relaxed">내가 저장한 원두와 컵 노트를 SNS에 올리기 좋은 이미지 아티팩트로 다운로드</p>
              </div>
              <span className="text-xs font-extrabold text-espresso mt-3 block">이미지 파일</span>
            </div>

          </div>
        </section>

        {/* Footer info area */}
        <footer className="w-full bg-white/30 backdrop-blur-md border border-white/40 rounded-3xl p-5 flex flex-col md:flex-row justify-between items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5 text-espresso/50">
            <Layers size={13} className="text-caramel" />
            <span>Hyangmi Korean Specialty Coffee Archive</span>
          </div>

          <LegalFooterLinks />
        </footer>
      </div>
    </main>
  );
}
