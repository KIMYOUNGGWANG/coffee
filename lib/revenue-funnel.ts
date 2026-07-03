export type RevenueFunnelProfile = {
  readonly credits: number;
  readonly has_pdf_access: boolean;
  readonly is_premium: boolean;
  readonly monthly_scan_limit: number;
  readonly scans_used: number;
};

export type RevenueFunnelInput = {
  readonly cardCount: number;
  readonly hasPublicCard: boolean;
  readonly profile: RevenueFunnelProfile | undefined;
};

export type RevenueFunnelStage = "capture" | "share" | "passport" | "premium";
export type RevenueFunnelAction = "create_card" | "share_latest" | "open_payment";
export type RevenueFunnelStepStatus = "complete" | "active" | "locked";

export type RevenueOffer = {
  readonly id: "free" | "premium" | "credits" | "passport";
  readonly label: string;
  readonly price: string;
  readonly description: string;
};

export type RevenueFunnelStep = {
  readonly id: RevenueFunnelStage;
  readonly label: string;
  readonly status: RevenueFunnelStepStatus;
};

export type RevenueFunnelState = {
  readonly stage: RevenueFunnelStage;
  readonly headline: string;
  readonly progressLabel: string;
  readonly primaryAction: RevenueFunnelAction;
  readonly primaryLabel: string;
  readonly monetizationHint: string;
  readonly steps: readonly RevenueFunnelStep[];
};

export const revenueOffers = [
  {
    id: "free",
    label: "무료 Taste Card",
    price: "$0",
    description: "첫 기록과 공유 카드로 취향 아카이브를 시작",
  },
  {
    id: "premium",
    label: "CoffeeDex Premium",
    price: "$3.99/mo",
    description: "월간 한도 없는 원두 사진 판독과 취향 리캡",
  },
  {
    id: "credits",
    label: "테이스팅 10팩",
    price: "$4.99",
    description: "무료 스캔 이후에도 원두 패키지 10장 추가 분석",
  },
  {
    id: "passport",
    label: "Taste Passport",
    price: "$9.99",
    description: "누적 카드를 디지털 홈카페 기록북 PDF로 소장",
  },
] as const satisfies readonly RevenueOffer[];

const stepLabels = {
  capture: "첫 카드 저장",
  share: "공유 링크 만들기",
  passport: "Taste Passport",
  premium: "Premium 전환",
} as const satisfies Record<RevenueFunnelStage, string>;

const funnelStages = ["capture", "share", "passport", "premium"] as const satisfies readonly RevenueFunnelStage[];

function completedCount(input: RevenueFunnelInput): number {
  const profile = input.profile;
  return [
    input.cardCount > 0,
    input.hasPublicCard,
    profile?.has_pdf_access === true,
    profile?.is_premium === true,
  ].filter(Boolean).length;
}

function readStage(input: RevenueFunnelInput): RevenueFunnelStage {
  if (input.cardCount === 0) return "capture";
  if (!input.hasPublicCard) return "share";
  if (input.profile?.has_pdf_access !== true) return "passport";
  return "premium";
}

function stepStatus(step: RevenueFunnelStage, stage: RevenueFunnelStage, input: RevenueFunnelInput): RevenueFunnelStepStatus {
  if (step === "capture" && input.cardCount > 0) return "complete";
  if (step === "share" && input.hasPublicCard) return "complete";
  if (step === "passport" && input.profile?.has_pdf_access === true) return "complete";
  if (step === "premium" && input.profile?.is_premium === true) return "complete";
  return step === stage ? "active" : "locked";
}

function stateCopy(stage: RevenueFunnelStage): Pick<RevenueFunnelState, "headline" | "primaryAction" | "primaryLabel" | "monetizationHint"> {
  switch (stage) {
    case "capture":
      return {
        headline: "첫 기록이 결제보다 먼저입니다",
        primaryAction: "create_card",
        primaryLabel: "첫 Taste Card 만들기",
        monetizationHint: "무료 Taste Card로 시작하고, 기록이 쌓이면 Premium과 Taste Passport가 자연스럽게 열립니다.",
      };
    case "share":
      return {
        headline: "저장한 카드가 성장 루프가 됩니다",
        primaryAction: "share_latest",
        primaryLabel: "최근 카드 공유하기",
        monetizationHint: "공유 링크가 새 방문자를 데려오고, 누적 기록은 Taste Passport 구매 이유가 됩니다.",
      };
    case "passport":
      return {
        headline: "누적 기록을 Taste Passport로 묶을 차례입니다",
        primaryAction: "open_payment",
        primaryLabel: "Taste Passport 열기",
        monetizationHint: "Taste Passport는 저장한 카드를 PDF 기록북으로 소장하는 $9.99 디지털 아티팩트입니다.",
      };
    case "premium":
      return {
        headline: "스캔 한도를 없애고 기록 루틴을 유지하세요",
        primaryAction: "open_payment",
        primaryLabel: "Premium으로 계속 기록하기",
        monetizationHint: "CoffeeDex Premium은 월 $3.99로 원두 패키지 스캔과 취향 리캡을 계속 이어갑니다.",
      };
  }
}

export function getRevenueFunnelState(input: RevenueFunnelInput): RevenueFunnelState {
  const stage = readStage(input);
  const copy = stateCopy(stage);
  const steps = funnelStages.map((step) => ({
    id: step,
    label: stepLabels[step],
    status: stepStatus(step, stage, input),
  }));

  return {
    ...copy,
    stage,
    progressLabel: `${completedCount(input)} / ${steps.length}`,
    steps,
  };
}
