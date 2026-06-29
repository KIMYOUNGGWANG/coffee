export type DialInShelfItem = {
  readonly id: string;
  readonly roaster_name: string;
  readonly bean_name: string;
  readonly origin: string | null;
  readonly roast_date: string | null;
  readonly opened_date: string | null;
  readonly fill_level: number;
  readonly is_finished: boolean;
};

export type DialInBrewLog = {
  readonly id: string;
  readonly shelf_item_id: string | null;
  readonly brewed_at: string;
  readonly method: string;
  readonly parameters: Record<string, unknown>;
  readonly rating: number | null;
  readonly simple_note: string | null;
};

export type DialInRecipe = {
  readonly method: string;
  readonly coffeeAmount: number;
  readonly waterAmount: number;
  readonly waterTemp: number;
  readonly grindSize: string;
  readonly brewTime: string;
  readonly ratioLabel: string;
};

export type DialInAdjustment = {
  readonly trigger: "too_sour" | "too_bitter" | "too_weak" | "too_heavy";
  readonly label: string;
  readonly nextMove: string;
};

export type DialInCoachData = {
  readonly generatedAt: string;
  readonly selectedShelfItemId: string | null;
  readonly title: string;
  readonly subtitle: string;
  readonly problem: string;
  readonly recipe: DialInRecipe;
  readonly adjustments: readonly DialInAdjustment[];
  readonly evidence: readonly string[];
  readonly suggestedLog: {
    readonly shelfItemId: string | null;
    readonly method: string;
    readonly parameters: DialInRecipe;
    readonly simpleNote: string;
    readonly coachSnapshot: {
      readonly source: "dial_in_coach";
      readonly title: string;
      readonly generatedAt: string;
      readonly evidence: readonly string[];
    };
  };
};

type BuildDialInCoachInput = {
  readonly shelfItems: readonly DialInShelfItem[];
  readonly brewingLogs: readonly DialInBrewLog[];
  readonly now?: Date;
};

const fallbackRecipe: DialInRecipe = {
  method: "V60",
  coffeeAmount: 15,
  waterAmount: 240,
  waterTemp: 92,
  grindSize: "Medium Fine",
  brewTime: "2:40",
  ratioLabel: "1:16",
};

const defaultAdjustments: readonly DialInAdjustment[] = [
  {
    trigger: "too_sour",
    label: "시거나 날카로우면",
    nextMove: "분쇄를 한 단계 곱게 하거나 물 온도를 1-2도 올려요.",
  },
  {
    trigger: "too_bitter",
    label: "쓰거나 텁텁하면",
    nextMove: "분쇄를 한 단계 굵게 하거나 총 추출 시간을 15초 줄여요.",
  },
  {
    trigger: "too_weak",
    label: "묽고 비어 있으면",
    nextMove: "물량을 15g 줄이거나 원두를 1g 늘려 농도를 올려요.",
  },
  {
    trigger: "too_heavy",
    label: "무겁고 답답하면",
    nextMove: "물량을 10-15g 늘리거나 마지막 푸어를 더 빠르게 마쳐요.",
  },
];

function daysSince(dateValue: string | null, now: Date): number | null {
  if (!dateValue) return null;
  const parsed = new Date(`${dateValue}T00:00:00.000Z`);
  if (!Number.isFinite(parsed.getTime())) return null;
  return Math.max(0, Math.floor((now.getTime() - parsed.getTime()) / (24 * 60 * 60 * 1000)));
}

function normalize(value: string): string {
  return value.normalize("NFKC").toLocaleLowerCase("ko-KR");
}

function readNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function scoreShelfItem(item: DialInShelfItem): number {
  if (item.is_finished || item.fill_level <= 0) return -100;
  return item.fill_level <= 25 ? 20 : item.fill_level <= 50 ? 12 : 5;
}

function selectShelfItem(shelfItems: readonly DialInShelfItem[]): DialInShelfItem | null {
  return [...shelfItems]
    .sort((first, second) => scoreShelfItem(second) - scoreShelfItem(first))
    .find((item) => !item.is_finished) ?? null;
}

function recipeFor(item: DialInShelfItem | null, logs: readonly DialInBrewLog[], now: Date): DialInRecipe {
  const recentSuccessfulLog = logs.find((log) => log.rating !== null && log.rating >= 4);
  if (recentSuccessfulLog) {
    const parameters = recentSuccessfulLog.parameters;
    return {
      method: recentSuccessfulLog.method,
      coffeeAmount: readNumber(parameters.coffeeAmount) ?? fallbackRecipe.coffeeAmount,
      waterAmount: readNumber(parameters.waterAmount) ?? fallbackRecipe.waterAmount,
      waterTemp: readNumber(parameters.waterTemp) ?? fallbackRecipe.waterTemp,
      grindSize: typeof parameters.grindSize === "string" ? parameters.grindSize : fallbackRecipe.grindSize,
      brewTime: typeof parameters.brewTime === "string" ? parameters.brewTime : fallbackRecipe.brewTime,
      ratioLabel: "이전 성공 로그 기반",
    };
  }

  const descriptor = normalize(`${item?.origin ?? ""} ${item?.bean_name ?? ""}`);
  const roastAge = daysSince(item?.roast_date ?? null, now);
  const isBright = /(ethiopia|kenya|washed|게이샤|에티오피아|케냐|워시드|시트러스|플로럴)/.test(descriptor);
  const isDeveloped = /(brazil|colombia|natural|브라질|콜롬비아|내추럴|초콜릿|카카오|너티)/.test(descriptor);

  if (isBright) {
    return {
      method: "V60",
      coffeeAmount: 15,
      waterAmount: 240,
      waterTemp: roastAge !== null && roastAge <= 5 ? 91 : 93,
      grindSize: "Medium Fine",
      brewTime: "2:45",
      ratioLabel: "1:16",
    };
  }

  if (isDeveloped) {
    return {
      method: "V60",
      coffeeAmount: 16,
      waterAmount: 240,
      waterTemp: 90,
      grindSize: "Medium",
      brewTime: "2:30",
      ratioLabel: "1:15",
    };
  }

  return fallbackRecipe;
}

function evidenceFor(
  item: DialInShelfItem | null,
  logs: readonly DialInBrewLog[],
  now: Date,
): readonly string[] {
  const evidence: string[] = [];
  const roastAge = daysSince(item?.roast_date ?? null, now);
  const openedAge = daysSince(item?.opened_date ?? null, now);
  const failedLog = logs.find((log) => log.rating !== null && log.rating <= 2);
  const successfulLog = logs.find((log) => log.rating !== null && log.rating >= 4);

  if (item) evidence.push(`${item.roaster_name} ${item.bean_name} 잔량 ${item.fill_level}%`);
  if (roastAge !== null) evidence.push(`로스팅 후 ${roastAge}일`);
  if (openedAge !== null) evidence.push(`개봉 후 ${openedAge}일`);
  if (successfulLog) evidence.push(`최근 ${successfulLog.method} 성공 로그 반영`);
  if (failedLog?.simple_note) evidence.push(`최근 실패 메모: ${failedLog.simple_note}`);

  return evidence.length > 0 ? evidence : ["선반 원두를 등록하면 원두별 시작점을 더 정확히 제안합니다."];
}

function problemFor(logs: readonly DialInBrewLog[]): string {
  const failedLog = logs.find((log) => log.rating !== null && log.rating <= 2);
  if (!failedLog) return "새 원두의 첫 컵을 안정적으로 시작하는 것이 목표입니다.";

  const note = normalize(failedLog.simple_note ?? "");
  if (/(sour|시큼|시다|산미)/.test(note)) return "최근 컵이 시거나 날카로웠어요. 추출을 조금 더 밀어주는 플랜입니다.";
  if (/(bitter|쓴|떫|텁텁)/.test(note)) return "최근 컵이 쓰거나 텁텁했어요. 과추출을 줄이는 플랜입니다.";
  if (/(weak|watery|묽|밍밍|연하)/.test(note)) return "최근 컵이 비어 있었어요. 농도를 먼저 잡는 플랜입니다.";

  return "최근 아쉬운 로그를 바탕으로 한 번에 하나만 바꾸는 플랜입니다.";
}

export function buildDialInCoach(input: BuildDialInCoachInput): DialInCoachData {
  const now = input.now ?? new Date();
  const item = selectShelfItem(input.shelfItems);
  const itemLogs = item
    ? input.brewingLogs.filter((log) => log.shelf_item_id === item.id)
    : input.brewingLogs;
  const recipe = recipeFor(item, itemLogs, now);
  const evidence = evidenceFor(item, itemLogs, now);
  const title = item ? `${item.roaster_name} ${item.bean_name}` : "오늘의 첫 추출 시작점";

  return {
    generatedAt: now.toISOString(),
    selectedShelfItemId: item?.id ?? null,
    title,
    subtitle: item?.origin ?? "CoffeeDex Dial-in Coach",
    problem: problemFor(itemLogs),
    recipe,
    adjustments: defaultAdjustments,
    evidence,
    suggestedLog: {
      shelfItemId: item?.id ?? null,
      method: recipe.method,
      parameters: recipe,
      simpleNote: `Dial-in Coach 시작 레시피: ${recipe.coffeeAmount}g/${recipe.waterAmount}g, ${recipe.waterTemp}C, ${recipe.grindSize}, ${recipe.brewTime}`,
      coachSnapshot: {
        source: "dial_in_coach",
        title,
        generatedAt: now.toISOString(),
        evidence,
      },
    },
  };
}
