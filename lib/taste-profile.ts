export const tasteProfileKeys = ["bright", "sweet", "balanced"] as const;

export type TasteProfileKey = (typeof tasteProfileKeys)[number];

export type TasteProfilePreset = {
  readonly key: TasteProfileKey;
  readonly label: string;
  readonly notes: string;
  readonly score: string;
  readonly cue: string;
  readonly metricPreview: string;
  readonly formDefaults: {
    readonly metric1: number;
    readonly metric2: number;
    readonly metric3: number;
    readonly tags: readonly string[];
    readonly rawNote: string;
  };
};

export const tasteProfilePresets: readonly TasteProfilePreset[] = [
  {
    key: "bright",
    label: "밝고 과일 같은 컵",
    notes: "귤, 복숭아, 재스민",
    score: "산미 5.0",
    cue: "화사한 산미와 향긋한 과일 향을 먼저 기록합니다.",
    metricPreview: "산미 5 / 단맛 4 / 바디 2",
    formDefaults: {
      metric1: 5,
      metric2: 4,
      metric3: 2,
      tags: ["Citrus", "Peach", "Jasmine"],
      rawNote: "밝고 과일 같은 컵. 귤, 복숭아, 재스민처럼 산뜻한 향을 먼저 느꼈다.",
    },
  },
  {
    key: "sweet",
    label: "달고 고소한 컵",
    notes: "꿀, 견과, 카카오",
    score: "단맛 5.0",
    cue: "단맛과 고소함을 중심으로 첫 Taste Card를 시작합니다.",
    metricPreview: "산미 3 / 단맛 5 / 바디 3",
    formDefaults: {
      metric1: 3,
      metric2: 5,
      metric3: 3,
      tags: ["Honey", "Caramel", "Cacao"],
      rawNote: "달고 고소한 단맛이 중심인 컵. 꿀, 견과, 카카오 같은 여운이 남았다.",
    },
  },
  {
    key: "balanced",
    label: "깨끗하고 균형 잡힌 컵",
    notes: "브라운슈가, 차, 긴 여운",
    score: "바디 4.0",
    cue: "균형과 여운을 기준으로 산미, 단맛, 바디를 맞춥니다.",
    metricPreview: "산미 3 / 단맛 4 / 바디 4",
    formDefaults: {
      metric1: 3,
      metric2: 4,
      metric3: 4,
      tags: ["Brown Sugar", "Chocolate", "Floral"],
      rawNote: "깨끗하고 균형 잡힌 컵. 브라운슈가, 차 같은 느낌과 긴 여운이 좋았다.",
    },
  },
] as const;

export const tasteProfilePresetByKey = Object.fromEntries(
  tasteProfilePresets.map((preset) => [preset.key, preset]),
) as Record<TasteProfileKey, TasteProfilePreset>;

export function isTasteProfileKey(value: string | null): value is TasteProfileKey {
  return tasteProfileKeys.some((key) => key === value);
}
