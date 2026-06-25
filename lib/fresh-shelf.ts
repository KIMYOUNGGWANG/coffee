export type FreshShelfStatusKind = "waiting" | "drink_now" | "finish_soon" | "rebuy";

export type FreshShelfInput = {
  readonly roastDate?: string | null;
  readonly openedDate?: string | null;
  readonly fillLevel: number;
  readonly isFinished: boolean;
  readonly now?: Date;
};

export type FreshShelfStatus = {
  readonly kind: FreshShelfStatusKind;
  readonly label: string;
  readonly reason: string;
  readonly tone: "resting" | "fresh" | "warning" | "critical";
};

const DAY_MS = 24 * 60 * 60 * 1000;

function assertNever(value: never): never {
  throw new Error(`Unhandled FreshShelfStatusKind: ${value}`);
}

function daysSince(dateValue: string | null | undefined, now: Date): number | null {
  if (!dateValue) return null;
  const parsed = new Date(`${dateValue}T00:00:00.000Z`);
  if (Number.isNaN(parsed.getTime())) return null;
  return Math.max(0, Math.floor((now.getTime() - parsed.getTime()) / DAY_MS));
}

function status(kind: FreshShelfStatusKind, reason: string): FreshShelfStatus {
  switch (kind) {
    case "waiting":
      return {
        kind,
        label: "조금 기다려요",
        reason,
        tone: "resting",
      };
    case "drink_now":
      return {
        kind,
        label: "지금 마시기 좋아요",
        reason,
        tone: "fresh",
      };
    case "finish_soon":
      return {
        kind,
        label: "마무리할 때",
        reason,
        tone: "warning",
      };
    case "rebuy":
      return {
        kind,
        label: "다시 살 타이밍",
        reason,
        tone: "critical",
      };
  }

  return assertNever(kind);
}

export function evaluateFreshShelfStatus(input: FreshShelfInput): FreshShelfStatus {
  const now = input.now ?? new Date();
  const fillLevel = Math.max(0, Math.min(100, Math.round(input.fillLevel)));
  const roastAgeDays = daysSince(input.roastDate, now);
  const openedAgeDays = daysSince(input.openedDate, now);

  if (input.isFinished || fillLevel <= 10) {
    return status("rebuy", "거의 비었어요. 다시 살지 판단할 타이밍입니다.");
  }

  if (openedAgeDays !== null && openedAgeDays >= 21) {
    return status("finish_soon", `개봉 후 ${openedAgeDays}일째입니다. 맛이 더 흐려지기 전에 마무리해 보세요.`);
  }

  if (fillLevel <= 25) {
    return status("finish_soon", `잔량 ${fillLevel}%입니다. 좋았던 컵이면 재구매 기억을 남겨두세요.`);
  }

  if (openedAgeDays !== null && openedAgeDays <= 14) {
    return status("drink_now", `개봉 후 ${openedAgeDays}일째입니다. 오늘의 컵으로 꺼내기 좋습니다.`);
  }

  if (roastAgeDays !== null && roastAgeDays <= 4) {
    return status("waiting", `로스팅 후 ${roastAgeDays}일째입니다. 조금 더 안정된 뒤 열어도 좋습니다.`);
  }

  if (roastAgeDays !== null && roastAgeDays <= 21) {
    return status("drink_now", `로스팅 후 ${roastAgeDays}일째입니다. 향미를 확인하기 좋은 구간입니다.`);
  }

  return status("finish_soon", "날짜 정보가 부족하거나 신선 구간을 지났습니다. 잔량을 보며 마무리해 보세요.");
}
