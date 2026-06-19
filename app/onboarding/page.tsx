import Link from "next/link";
import { Camera, Coffee, Compass, FileText, ScanLine, Sparkles } from "lucide-react";
import OnboardingTasteFinder from "@/components/onboarding-taste-finder";
import {
  buildDashboardActivationHref,
  buildFirstCardActivationIntent,
  readOnboardingContextFromRecord,
} from "@/lib/activation-intent";
import { coffeeDexBrand } from "@/lib/brand";

const onboardingFlow = [
  {
    eyebrow: "01 / Taste profile",
    title: "오늘 취향의 시작점 선택",
    copy: "처음부터 정답을 쓰지 않아도 됩니다. 밝음, 단맛, 균형 중 가까운 컵을 고르면 첫 취향 지도가 열립니다.",
    icon: Compass,
  },
  {
    eyebrow: "02 / AI label scan",
    title: "패키지 스캔 초안 확인",
    copy: "라벨 초안은 원두명, 로스터리, 산지, 가공 방식을 빠르게 채우고 저장 전 사용자가 직접 고칩니다.",
    icon: ScanLine,
  },
  {
    eyebrow: "03 / Korean flavor words",
    title: "한국어 향미 단어로 기억",
    copy: "귤, 꿀, 재스민, 고소함처럼 내가 말하는 맛을 기록하고 SCA 스타일 컵 노트로 다듬습니다.",
    icon: Coffee,
  },
  {
    eyebrow: "04 / Archive output",
    title: "추천과 리캡의 재료 만들기",
    copy: "쌓인 카드는 취향 지도, 공유 카드, PDF 기록북, 다음 원두 추천의 근거가 됩니다.",
    icon: FileText,
  },
] as const;

type OnboardingPageProps = {
  readonly searchParams: Promise<Record<string, string | readonly string[] | undefined>>;
};

function activationHeadline(contextKind: "default" | "public_card"): string {
  switch (contextKind) {
    case "default":
      return "첫 한국 스페셜티 커피 기억을 기록할 준비";
    case "public_card":
      return "방금 본 공개 카드처럼 내 첫 Taste Card 만들기";
    default:
      return assertNever(contextKind);
  }
}

function activationCopy(contextKind: "default" | "public_card"): string {
  switch (contextKind) {
    case "default":
      return `${coffeeDexBrand.name}는 카페와 홈카페에서 마신 스페셜티 커피를 개인 테이스팅 아카이브로 남기고, AI가 라벨 초안과 SCA 스타일 노트 작성을 보조하는 기록 공간입니다.`;
    case "public_card":
      return "공유 받은 커피 기록을 보고 끝내지 말고, 오늘 마신 원두도 같은 Taste Card 흐름으로 저장해보세요.";
    default:
      return assertNever(contextKind);
  }
}

function assertNever(value: never): never {
  throw new Error(`Unexpected onboarding context: ${JSON.stringify(value)}`);
}

export default async function OnboardingPage({ searchParams }: OnboardingPageProps) {
  const onboardingContext = readOnboardingContextFromRecord(await searchParams);
  const activationIntent = buildFirstCardActivationIntent(onboardingContext);
  const dashboardHref = buildDashboardActivationHref(activationIntent);

  return (
    <main className="hyangmi-paper min-h-screen overflow-hidden text-foreground">
      <div className="mx-auto max-w-7xl px-4 py-5 md:px-8 md:py-8">
        <header className="flex items-center justify-between border-b border-white/10 pb-4">
          <Link href="/" className="group flex items-center gap-3">
            <span className="grid size-10 place-items-center border border-[var(--paper-border)] bg-white/50 text-[var(--paper-foreground)] shadow-[4px_4px_0_rgba(47,37,31,0.12)] transition-transform group-hover:-translate-y-0.5">
              <Coffee size={18} />
            </span>
            <span>
              <span className="block font-serif text-xl font-black leading-none">{coffeeDexBrand.name}</span>
              <span className="mt-1 block text-[10px] font-extrabold uppercase tracking-[0.26em] text-muted-foreground/60">
                Taste Onboarding
              </span>
            </span>
          </Link>
          <Link
            href="/dashboard"
            className="hidden border-b border-white/10/30 px-1 py-2 text-xs font-black text-muted-foreground transition hover:border-white/10 hover:text-foreground sm:inline-flex"
          >
            샘플 CoffeeDex 기록 보기
          </Link>
        </header>

        <section className="grid min-h-[calc(100vh-6rem)] grid-cols-1 items-center gap-10 py-10 lg:grid-cols-[0.94fr_1.06fr] lg:py-14">
          <div className="max-w-2xl">
            <div className="issue-marker mb-6 text-[10px] font-black uppercase tracking-[0.22em] text-[#7b4d34]">
              <Sparkles size={12} />
              CoffeeDex Korea-first Onboarding
            </div>
            <h1 className="break-keep font-serif text-4xl font-black leading-tight text-foreground md:text-6xl">
              {activationHeadline(onboardingContext.kind)}
            </h1>
            <p className="mt-6 max-w-xl text-sm font-semibold leading-7 text-foreground/64 md:text-base">
              {activationCopy(onboardingContext.kind)}
            </p>

            <div className="mt-7 border-l border-white/10 pl-5">
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#9f6a4a]">
                30-second Taste Finder
              </p>
              <p className="mt-2 break-keep font-serif text-2xl font-black leading-tight text-foreground">
                먼저 취향을 고르고, 봉투 사진으로 첫 카드를 완성하세요.
              </p>
            </div>

          </div>

          <div className="grid gap-4">
            <div>
              <OnboardingTasteFinder dashboardHref={dashboardHref} />
            </div>

            <div className="grid grid-cols-1 gap-px border border-white/10/18 glass-card border border-white/10/18 md:grid-cols-2">
              {onboardingFlow.map(({ eyebrow, title, copy, icon: Icon }) => (
                <article key={title} className="bg-[#2f251f] p-5 text-cream">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#e1b698]">{eyebrow}</p>
                      <h3 className="mt-4 break-keep font-serif text-2xl font-black leading-tight">{title}</h3>
                    </div>
                    <span className="grid size-10 shrink-0 place-items-center border border-cream/25 text-[#e1b698]">
                      <Icon size={17} />
                    </span>
                  </div>
                  <p className="mt-5 text-sm font-semibold leading-7 text-cream/64">{copy}</p>
                </article>
              ))}
            </div>

            <div className="grid grid-cols-[0.8fr_1.2fr] gap-3 border border-[#1f4651] bg-[#dcecf0] p-4 text-[#1f4651] shadow-[6px_6px_0_rgba(31,70,81,0.13)]">
              <div className="grid place-items-center border border-[#1f4651]/20 bg-[#f5fbfb]">
                <Camera size={30} />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em]">next useful hook</p>
                <p className="mt-2 break-keep text-sm font-extrabold leading-6">
                  원두 봉투를 찍으면 기록이 쉬워지고, 쌓인 기록은 다음 원두 추천의 이유가 됩니다.
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
