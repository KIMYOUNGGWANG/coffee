export type CoffeeDexBrand = {
  readonly name: "CoffeeDex";
  readonly koreanDisplay: "커피덱스";
  readonly category: "Coffee Memory & Repurchase";
  readonly tagline: "좋았던 원두를 잊지 않고, 다시 찾는 가장 빠른 방법";
  readonly englishTagline: "Remember coffee worth buying again.";
  readonly artifacts: {
    readonly free: "Taste Card";
    readonly paid: "Taste Passport";
  };
  readonly analytics: "Taste Snapshot";
  readonly dashboard: "Memory Shelf";
  readonly filenameSlug: "coffeedex";
};

export const coffeeDexBrand = {
  name: "CoffeeDex",
  koreanDisplay: "커피덱스",
  category: "Coffee Memory & Repurchase",
  tagline: "좋았던 원두를 잊지 않고, 다시 찾는 가장 빠른 방법",
  englishTagline: "Remember coffee worth buying again.",
  artifacts: {
    free: "Taste Card",
    paid: "Taste Passport",
  },
  analytics: "Taste Snapshot",
  dashboard: "Memory Shelf",
  filenameSlug: "coffeedex",
} as const satisfies CoffeeDexBrand;

/** @deprecated Use coffeeDexBrand. Kept while existing imports migrate. */
export const hyangmiBrand = coffeeDexBrand;
