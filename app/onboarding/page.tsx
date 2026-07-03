import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Coffee, ShieldCheck, Sparkles } from "lucide-react";
import OnboardingTasteFinder from "@/components/onboarding-taste-finder";
import {
  buildCaptureActivationHref,
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
      return "당신에게 맞는 커피를 다시 찾기 위한 첫 비공개 기록입니다. 취향을 하나 고르면 20초 빠른 기록과 한국어 향미 단어가 먼저 열립니다.";
    case "public_card":
      return "공유 받은 커피 기록을 보고 끝내지 말고, 방금 본 맛을 참고해 오늘 마신 원두도 20초 빠른 기록으로 안전하게 저장해보세요.";
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
  const captureHref = buildCaptureActivationHref(activationIntent);

  return (
    <main className="min-h-[100dvh] overflow-hidden bg-[#140d09] text-[#fff8ec]">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_16%_18%,rgba(199,122,72,0.24),transparent_28%),radial-gradient(circle_at_84%_18%,rgba(96,57,32,0.36),transparent_35%),linear-gradient(180deg,#24150f_0%,#120b08_58%,#070403_100%)]" aria-hidden="true" />
      <div className="pointer-events-none fixed inset-0 bg-[linear-gradient(90deg,rgba(255,248,236,0.045)_1px,transparent_1px),linear-gradient(180deg,rgba(255,248,236,0.035)_1px,transparent_1px)] bg-[size:72px_72px] opacity-45" aria-hidden="true" />
      <div className="relative mx-auto flex min-h-[100dvh] max-w-7xl flex-col px-5 py-5 md:px-8 md:py-8">
        <header className="flex items-center justify-between border-b border-[#fff8ec]/12 pb-4">
          <Link href="/" className="group flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-2xl border border-primary-amber/36 bg-primary-amber/12 text-primary-amber transition-transform group-hover:-translate-y-0.5">
              <Coffee size={18} />
            </span>
            <span>
              <span className="block font-serif text-xl font-black leading-none text-primary-amber">{coffeeDexBrand.name}</span>
              <span className="mt-1 block text-[10px] font-extrabold uppercase tracking-[0.26em] text-[#d8c8b6]">
                Korea-first specialty coffee
              </span>
            </span>
          </Link>
          <span className="text-sm font-black text-primary-amber">1 / 3</span>
          <Link
            href="/dashboard"
            className="hidden rounded-full border border-[#fff8ec]/16 bg-[#fff8ec]/8 px-4 py-2 text-xs font-black text-[#fff8ec] shadow-sm transition hover:border-[#c77a48]/50 hover:bg-[#fff8ec]/14 sm:inline-flex"
            style={{ color: "#fff8ec" }}
          >
            샘플 CoffeeDex 기록 보기
          </Link>
        </header>

        <section className="grid flex-1 grid-cols-1 items-center gap-8 py-7 sm:gap-10 sm:py-9 lg:grid-cols-[0.88fr_1.12fr] lg:py-10">
          <div className="max-w-2xl min-w-0">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#c77a48]/38 bg-[#c77a48]/14 px-3 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-[#e9a271] shadow-sm">
              <Sparkles size={12} />
              비공개 첫 기록
            </div>
            <h1 className="mt-7 max-w-xl break-keep font-serif text-4xl font-black leading-[1.06] text-[#fff8ec] sm:text-5xl md:text-[4rem]">
              {activationHeadline(onboardingContext.kind)}
            </h1>
            <p className="mt-6 max-w-xl break-keep text-base font-semibold leading-8 text-[#d8c8b6] md:text-lg">
              {activationCopy(onboardingContext.kind)}
            </p>

            <div className="mt-8 grid gap-3 break-keep text-sm font-semibold leading-6 text-[#cbbba8]">
              <div className="flex items-center gap-3">
                <ShieldCheck className="text-primary-amber" size={16} />
                <span>선택은 언제든 바꿀 수 있어요.</span>
              </div>
              <div className="flex items-center gap-3">
              <ArrowRight className="text-primary-amber" size={16} />
              <span>취향 선택 후 로그인 없는 20초 기록으로 바로 이어져요.</span>
              </div>
            </div>
          </div>

          <div className="relative grid min-w-0 gap-5 sm:gap-6">
            <div className="absolute right-2 top-40 hidden w-40 opacity-80 lg:block xl:w-48">
              <Image
                src="/images/onboarding/private-espresso-coffee-bag.png"
                alt="CoffeeDex 온보딩을 위한 성수 블렌드 커피백"
                width={900}
                height={1200}
                priority
                className="h-auto w-full rounded-[1.75rem] object-contain shadow-[0_32px_80px_rgba(0,0,0,0.36)]"
              />
            </div>

            <div className="relative z-10">
              <OnboardingTasteFinder dashboardHref={captureHref} />
            </div>

            <div className="relative z-10 flex items-center gap-4 rounded-3xl border border-primary-amber/18 bg-[#fff8ec]/7 p-4 text-[#fff8ec]/76 lg:hidden">
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
