import Link from "next/link";
import { ChevronRight } from "lucide-react";
import {
  buildDashboardActivationHref,
  buildFirstCardActivationIntent,
  readOnboardingContextFromRecord,
} from "@/lib/activation-intent";
import { hyangmiBrand } from "@/lib/brand";

const onboardingChecklist = [
  "첫 Hyangmi 테이스팅 카드에 원두 이름과 한국 로스터리 기록",
  "산미, 단맛, 바디, 애프터테이스트 기준으로 오늘의 맛 선택",
  "귤, 꿀, 재스민, 고소함 같은 한국어 향미 단어로 메모",
  "패키지 스캔 초안을 확인하고 틀린 원두 정보를 직접 수정",
  "홈카페 대시보드에서 저장된 기록 기반 취향 지도 확인",
  "공유용 Hyangmi 스토리 카드와 PDF 내보내기 점검",
];

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
      return `${hyangmiBrand.name}는 카페와 홈카페에서 마신 스페셜티 커피를 개인 테이스팅 아카이브로 남기고, AI가 라벨 초안과 SCA 스타일 노트 작성을 보조하는 기록 공간입니다.`;
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
    <main className="starter-shell">
      <section className="surface-panel">
        <div className="surface-header">
          <div>
            <p className="hero-kicker">Hyangmi Korea-first Onboarding</p>
            <h1>{activationHeadline(onboardingContext.kind)}</h1>
            <p className="hero-copy">{activationCopy(onboardingContext.kind)}</p>
          </div>
        </div>

        <ul className="checklist">
          {onboardingChecklist.map((item) => (
            <li key={item}>
              <span className="checkmark" />
              <span>{item}</span>
            </li>
          ))}
        </ul>

        <div className="button-row" style={{ marginTop: "1rem" }}>
          <Link
            href={dashboardHref}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-[var(--accent)] px-4 py-2 text-sm font-medium text-[var(--accent-foreground)] transition-colors hover:opacity-90 focus-visible:outline-none focus-visible:ring-4"
          >
            첫 Taste Card 시작하기
            <ChevronRight size={15} />
          </Link>
          <Link
            href="/dashboard"
            className="inline-flex h-10 items-center justify-center rounded-md border border-[var(--border)] bg-transparent px-4 py-2 text-sm font-medium text-[var(--foreground)] transition-colors hover:bg-white focus-visible:outline-none focus-visible:ring-4"
          >
            샘플 Hyangmi 기록 보기
          </Link>
        </div>
      </section>
    </main>
  );
}
