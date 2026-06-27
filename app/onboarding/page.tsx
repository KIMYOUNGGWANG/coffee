import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Coffee, ShieldCheck, Sparkles } from "lucide-react";
import OnboardingTasteFinder from "@/components/onboarding-taste-finder";
import {
  buildDashboardActivationHref,
  buildFirstCardActivationIntent,
  readOnboardingContextFromRecord,
} from "@/lib/activation-intent";
import { coffeeDexBrand } from "@/lib/brand";

type OnboardingPageProps = {
  readonly searchParams: Promise<Record<string, string | readonly string[] | undefined>>;
};

function activationHeadline(contextKind: "default" | "public_card"): string {
  switch (contextKind) {
    case "default":
      return "오늘의 취향으로 첫 기록을 시작해요";
    case "public_card":
      return "방금 본 공개 카드처럼 내 취향 기록을 시작해요";
    default:
      return assertNever(contextKind);
  }
}

function activationCopy(contextKind: "default" | "public_card"): string {
  switch (contextKind) {
    case "default":
      return "당신에게 맞는 커피를 다시 찾기 위한 첫 Taste Card입니다. 취향을 하나 고르면 20초 빠른 기록과 한국어 향미 단어가 먼저 열립니다.";
    case "public_card":
      return "공유 받은 커피 기록을 보고 끝내지 말고, 오늘 마신 원두도 같은 흐름으로 안전하게 저장해보세요.";
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
    <main className="min-h-[100dvh] overflow-hidden bg-background-dark text-foreground">
      <div className="mx-auto flex min-h-[100dvh] max-w-7xl flex-col px-5 py-5 md:px-8 md:py-8">
        <header className="flex items-center justify-between border-b border-white/10 pb-4">
          <Link href="/" className="group flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-2xl border border-primary-amber/30 bg-primary-amber/10 text-primary-amber transition-transform group-hover:-translate-y-0.5">
              <Coffee size={18} />
            </span>
            <span>
              <span className="block font-serif text-xl font-black leading-none text-primary-amber">{coffeeDexBrand.name}</span>
              <span className="mt-1 block text-[10px] font-extrabold uppercase tracking-[0.26em] text-[#F7F7F4]/48">
                Korea-first specialty coffee
              </span>
            </span>
          </Link>
          <span className="text-sm font-black text-primary-amber">1 / 3</span>
          <Link
            href="/dashboard"
            className="hidden rounded-full border border-white/10 px-4 py-2 text-xs font-black text-[#F7F7F4]/64 transition hover:border-primary-amber/40 hover:text-primary-amber sm:inline-flex"
          >
            샘플 CoffeeDex 기록 보기
          </Link>
        </header>

        <section className="grid flex-1 grid-cols-1 items-center gap-8 py-7 sm:gap-10 sm:py-9 lg:grid-cols-[0.9fr_1.1fr] lg:py-12">
          <div className="max-w-2xl min-w-0">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary-amber/24 bg-primary-amber/10 px-3 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-primary-amber">
              <Sparkles size={12} />
              Private espresso concierge
            </div>
            <h1 className="mt-7 break-keep font-serif text-4xl font-black leading-[1.12] text-[#F7F7F4] sm:text-5xl md:text-6xl">
              {activationHeadline(onboardingContext.kind)}
            </h1>
            <p className="mt-6 max-w-xl break-keep text-base font-semibold leading-8 text-[#F7F7F4]/68 md:text-lg">
              {activationCopy(onboardingContext.kind)}
            </p>

            <div className="mt-8 grid gap-3 break-keep text-sm font-semibold leading-6 text-[#F7F7F4]/64">
              <div className="flex items-center gap-3">
                <ShieldCheck className="text-primary-amber" size={16} />
                <span>선택은 언제든 바꿀 수 있어요.</span>
              </div>
              <div className="flex items-center gap-3">
                <ArrowRight className="text-primary-amber" size={16} />
                <span>취향 선택 후 빠른 기록으로 바로 이어지고, 봉투 스캔은 대시보드에서 계속 선택할 수 있어요.</span>
              </div>
            </div>
          </div>

          <div className="relative grid min-w-0 gap-5 sm:gap-6">
            <div className="absolute right-0 top-48 hidden w-44 lg:block xl:w-52">
              <Image
                src="/images/onboarding/private-espresso-coffee-bag.png"
                alt="CoffeeDex 온보딩을 위한 성수 블렌드 커피백"
                width={900}
                height={1200}
                priority
                className="h-auto w-full rounded-[2rem] object-contain shadow-[0_32px_80px_rgba(0,0,0,0.42)]"
              />
            </div>

            <div className="relative z-10">
              <OnboardingTasteFinder dashboardHref={dashboardHref} />
            </div>

            <div className="relative z-10 flex items-center gap-4 rounded-3xl border border-primary-amber/14 bg-white/[0.03] p-4 text-[#F7F7F4]/64 lg:hidden">
              <Image
                src="/images/onboarding/private-espresso-coffee-bag.png"
                alt=""
                width={900}
                height={1200}
                className="h-24 w-20 shrink-0 rounded-2xl object-cover"
              />
              <p className="break-keep text-sm font-semibold leading-6">
                한국 스페셜티 커피를 내 취향 언어로 남기고, 다음에 다시 살 커피를 쉽게 찾습니다.
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
