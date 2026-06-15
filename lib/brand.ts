export type HyangmiBrand = {
  readonly name: "Hyangmi";
  readonly koreanDisplay: "향미";
  readonly category: "Coffee Taste Archive";
  readonly tagline: "마신 원두가 취향의 기록이 되는 곳";
  readonly englishTagline: "Your coffee taste, beautifully remembered.";
  readonly artifacts: {
    readonly free: "Taste Card";
    readonly paid: "Taste Passport";
  };
  readonly analytics: "Taste Map";
  readonly dashboard: "Archive";
  readonly filenameSlug: "hyangmi";
};

export const hyangmiBrand = {
  name: "Hyangmi",
  koreanDisplay: "향미",
  category: "Coffee Taste Archive",
  tagline: "마신 원두가 취향의 기록이 되는 곳",
  englishTagline: "Your coffee taste, beautifully remembered.",
  artifacts: {
    free: "Taste Card",
    paid: "Taste Passport",
  },
  analytics: "Taste Map",
  dashboard: "Archive",
  filenameSlug: "hyangmi",
} as const satisfies HyangmiBrand;
