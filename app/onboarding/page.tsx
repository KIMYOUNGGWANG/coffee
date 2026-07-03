import Link from "next/link";
import Image from "next/image";
import { ArrowRight, ShieldCheck, Sparkles } from "lucide-react";
import { FigmaDashboardShell } from "@/components/figma-dashboard-shell";
import OnboardingTasteFinder from "@/components/onboarding-taste-finder";
import {
  buildCaptureActivationHref,
  buildFirstCardActivationIntent,
  readOnboardingContextFromRecord,
} from "@/lib/activation-intent";

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
    <FigmaDashboardShell
      activeHref="/capture"
      actions={(
        <Link
          href="/dashboard"
          className="hidden min-h-10 items-center rounded-full border border-[var(--border)] bg-[var(--surface)] px-4 py-2 text-xs font-black text-foreground shadow-sm transition hover:bg-[var(--surface-muted)] sm:inline-flex"
        >
          샘플 CoffeeDex 기록 보기
        </Link>
      )}
      description={activationCopy(onboardingContext.kind)}
      eyebrow="비공개 첫 기록 · 1 / 3"
      title={activationHeadline(onboardingContext.kind)}
    >
        <section className="grid grid-cols-1 items-center gap-8 lg:grid-cols-[0.88fr_1.12fr]">
          <div className="max-w-2xl min-w-0">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#c77a48]/38 bg-[#c77a48]/14 px-3 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-[#e9a271] shadow-sm">
              <Sparkles size={12} />
              Taste Finder 준비
            </div>
            <h2 className="mt-7 max-w-xl break-keep text-3xl font-black leading-tight sm:text-4xl">
              맛 방향을 먼저 고르고 바로 새 노트로 이어가요
            </h2>

            <div className="mt-8 grid gap-3 break-keep text-sm font-semibold leading-6 text-[#cbbba8]">
              <div className="flex items-center gap-3">
                <ShieldCheck className="text-primary-amber" size={16} />
                <span className="text-muted-foreground">선택은 언제든 바꿀 수 있어요.</span>
              </div>
              <div className="flex items-center gap-3">
              <ArrowRight className="text-primary-amber" size={16} />
              <span className="text-muted-foreground">취향 선택 후 로그인 없는 20초 기록으로 바로 이어져요.</span>
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

            <div className="dashboard-panel relative z-10 flex items-center gap-4 p-4 lg:hidden">
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
    </FigmaDashboardShell>
  );
}
