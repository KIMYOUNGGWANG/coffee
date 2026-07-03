import Link from "next/link";
import Image from "next/image";
import { Coffee, Sparkles, ChevronRight, Layers, BookOpen } from "lucide-react";
import LandingPricingSection from "@/components/landing-pricing-section";
import LandingPlaygroundLazy from "@/components/landing-playground-lazy";
import LegalFooterLinks from "@/components/legal-footer-links";
import { LandingFeatures } from "@/components/landing-features";
import { buttonVariants } from "@/components/ui/button";
import { coffeeDexBrand } from "@/lib/brand";
import { cn } from "@/lib/utils";
import { LandingSectionViewTracker } from "@/components/landing-analytics-client";

const copyrightYear = 2026;

export default function CoffeeDexHomePage() {
  return (
    <main className="min-h-screen overflow-x-clip bg-[var(--background)] p-4 text-foreground selection:bg-primary-amber/20 md:p-10">
      <LandingSectionViewTracker eventName="landing_view" />
      <div className="mx-auto max-w-7xl space-y-12">

        <header className="dashboard-panel flex w-full min-w-0 items-center justify-between gap-3 px-5 py-4 sm:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-[var(--surface-strong)] text-[var(--accent-foreground)] shadow-lg">
              <Coffee size={18} strokeWidth={2} />
            </div>
            <span className="font-serif font-extrabold text-lg tracking-wide">{coffeeDexBrand.name}</span>
          </div>

          <div className="flex items-center gap-6">
            <Link className="hidden text-sm font-bold tracking-wide text-muted-foreground transition-colors hover:text-foreground md:inline-flex" href="/onboarding">
              온보딩 가이드
            </Link>
            <Link className={cn(buttonVariants({ size: "sm" }), "shrink-0 rounded-full border-none bg-[var(--surface-strong)] px-5 py-4 text-xs font-bold !text-[var(--accent-foreground)] transition-all hover:bg-[#372319]")} href="/capture">
              20초 기록 시작
            </Link>
          </div>
        </header>

        {/* Hero split section */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center pt-8">

          {/* Hero text panel (6 columns) */}
          <div className="dashboard-panel space-y-8 p-6 text-left animate-in fade-in slide-in-from-bottom-8 duration-700 md:p-8 lg:col-span-7">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary-amber/20 bg-primary-amber/10 px-4 py-2 text-[11px] font-extrabold uppercase tracking-[0.2em] text-primary-amber shadow-inner">
              <Sparkles size={12} />
              Korea-first Specialty Coffee Memory
            </div>

            <h1 className="max-w-full break-keep text-[clamp(2.5rem,7vw,4.5rem)] font-extrabold leading-[1.1] text-foreground">
              다시 살 원두를 <br />
              <span className="text-primary-amber">20초 만에 기억,</span> <br />
              {coffeeDexBrand.name}.
            </h1>

            <p className="max-w-xl text-sm font-semibold leading-relaxed text-muted-foreground md:text-lg">
              기억이 사라지기 전에 원두, 로스터리, 다시 살 단서만 남기면 다음에 찾을 이유가 생깁니다. 사진 원본은 저장하지 않고, 저장할 때만 로그인해요.
            </p>

            <div className="flex flex-wrap gap-4 pt-4">
              <Link
                className={cn(
                  buttonVariants({ size: "default" }),
                  "flex items-center gap-2 rounded-full border-none bg-[var(--surface-strong)] px-8 py-6 text-sm font-extrabold !text-[var(--accent-foreground)] transition-all hover:-translate-y-1 hover:bg-[#372319]"
                )}
                href="/capture"
              >
                20초 기록 시작
                <ChevronRight size={18} />
              </Link>
              <Link
                className={cn(
                  buttonVariants({ variant: "outline", size: "default" }),
                  "rounded-full border-[var(--border)] bg-[var(--surface)] px-8 py-6 text-sm font-bold text-foreground transition-all hover:-translate-y-1 hover:bg-[var(--surface-muted)]"
                )}
                href="/onboarding"
              >
                Taste Finder로 맛 방향 고르기
              </Link>
            </div>
          </div>

          {/* Hero visual panel with 3D levitation frame (5 columns) */}
          <div className="lg:col-span-5 flex justify-center animate-in fade-in slide-in-from-right-8 duration-700 delay-150 perspective-1000">
            <div className="relative w-full max-w-[420px] aspect-[3/4] rounded-[2rem] transition-all duration-700 hover:rotate-0" style={{ transform: "rotateY(-10deg) rotateX(5deg) scale(0.95)" }}>
              {/* Premium Glow Behind Image */}
              <div className="absolute inset-0 bg-primary-amber/20 blur-[80px] -z-10 rounded-full" />
              
              <div className="group relative h-full w-full overflow-hidden rounded-[2rem] border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-panel)]">
                <div className="absolute inset-0 z-10 bg-gradient-to-tr from-[#291912]/45 via-transparent to-white/5 pointer-events-none" />
                
                <Image
                  src="/images/premium_coffee_brewing.png"
                  alt="CoffeeDex에 기록할 스페셜티 커피 브루잉 장면"
                  width={900}
                  height={1200}
                  priority
                  sizes="(min-width: 1024px) 420px, 92vw"
                  className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-1000 ease-out"
                />
                
                {/* Floating Detail Card */}
                <div className="absolute bottom-6 left-6 right-6 z-20 flex translate-y-2 items-center gap-4 rounded-2xl border border-[var(--border)] bg-[var(--surface)]/90 px-5 py-4 shadow-2xl backdrop-blur-xl transition-transform duration-500 group-hover:translate-y-0">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-primary-amber/20 bg-primary-amber/10 text-primary-amber">
                    <Coffee size={18} />
                  </div>
                  <div className="text-left flex-1 min-w-0">
                    <p className="text-[10px] uppercase font-bold text-primary-amber tracking-[0.15em] leading-none mb-1">오늘의 원두</p>
                    <p className="text-sm font-bold text-foreground truncate">Fritz Ethiopia Sidama</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </section>

        {/* Feature section in minimal grid format */}
        <section className="space-y-12 pt-10 border-t border-[var(--border)]">
          <div className="text-center max-w-2xl mx-auto space-y-4">
            <span className="text-[10px] uppercase font-bold tracking-[0.2em] text-primary-amber">
              경험의 확장
            </span>
            <h2 className="text-3xl md:text-4xl font-black text-foreground">좋았던 원두를 다시 찾는 기억장</h2>
            <p className="text-sm text-muted-foreground leading-relaxed font-semibold">
              처음에는 짧게 저장하고, 필요할 때만 스캔과 기록북으로 확장합니다.
            </p>
          </div>

          <LandingFeatures />
        </section>

        <div className="mx-auto w-full max-w-7xl py-12">
          <LandingPlaygroundLazy />
        </div>

        <LandingPricingSection />

        {/* Current product boundary section - redesigned */}
        <section className="dashboard-panel relative overflow-hidden p-8 md:p-12">
          <div className="flex flex-col md:flex-row justify-between items-start gap-6 border-b border-[var(--border)] pb-8 relative z-10">
            <div className="max-w-xl">
              <h2 className="text-2xl font-black text-foreground mb-2">오늘 제공하는 CoffeeDex 결과물</h2>
              <p className="text-sm font-semibold leading-relaxed text-muted-foreground">
                무료 기록은 비공개로 시작하고, Premium은 원두 봉투를 자주 읽는 사람을 위한 선택 기능입니다.
              </p>
            </div>
            <span className="inline-flex items-center gap-2 rounded-full border border-[#D4AF37]/20 bg-[#D4AF37]/10 px-4 py-2 text-xs font-bold text-[#D4AF37] tracking-widest uppercase">
              <BookOpen size={14} />
              Tasting archive
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 pt-8 relative z-10">
            {["Taste Passport", "Note Draft", "Rebuy Memory", "Story Export"].map((tag, idx) => (
              <div key={idx} className="flex flex-col space-y-4">
                <span className="text-[10px] uppercase font-bold tracking-wider text-primary-amber">/ {tag}</span>
                <div className="h-px w-8 bg-primary-amber/30" />
                <h3 className="text-base font-bold text-foreground">
                  {idx === 0 ? "맛 여권 스탬프 적립" : idx === 1 ? "원두 라벨 스캔 초안" : idx === 2 ? "재구매 기억과 다음 행동" : "공유용 스토리 카드"}
                </h3>
                <p className="text-xs text-muted-foreground font-semibold leading-relaxed">
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
        <footer className="w-full border-t border-[var(--border)] py-8 flex flex-col md:flex-row justify-between items-center gap-6 text-xs text-muted-foreground mt-24">
          <div className="flex items-center gap-2 font-serif">
            <Layers size={14} className="text-primary-amber" />
            <span>CoffeeDex © {copyrightYear}</span>
          </div>

          <LegalFooterLinks />
        </footer>
      </div>
    </main>
  );
}
