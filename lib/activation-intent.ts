import { z } from "zod";

const activationIntentKindSchema = z.enum(["first_card"]);
const activationSourceSchema = z.enum(["public_card", "onboarding"]);
const dashboardActivationSearchSchema = z.object({
  intent: activationIntentKindSchema.nullable(),
  source: activationSourceSchema.nullable(),
  token: z.string().min(1).nullable(),
});
const onboardingActivationSearchSchema = z.object({
  source: z.enum(["public_card"]).nullable(),
  token: z.string().min(1).nullable(),
});

export type ActivationSource = z.infer<typeof activationSourceSchema>;
export type DashboardActivationIntent =
  | { readonly kind: "first_card"; readonly source: ActivationSource; readonly token: string | null }
  | { readonly kind: "none" };
export type OnboardingActivationContext =
  | { readonly kind: "public_card"; readonly token: string }
  | { readonly kind: "default" };

type SearchParamRecord = Record<string, string | readonly string[] | undefined>;

function firstSearchParam(value: string | readonly string[] | undefined): string | null {
  if (typeof value === "string") {
    return value;
  }
  return value?.[0] ?? null;
}

function assertNever(value: never): never {
  throw new Error(`Unexpected activation intent: ${JSON.stringify(value)}`);
}

export function readActivationIntentFromRecord(searchParams: SearchParamRecord): DashboardActivationIntent {
  return readActivation({
    intent: firstSearchParam(searchParams.intent),
    source: firstSearchParam(searchParams.source),
    token: firstSearchParam(searchParams.token),
  });
}

export function readActivationIntentFromSearch(search: string): DashboardActivationIntent {
  const searchParams = new URLSearchParams(search);
  return readActivation({
    intent: searchParams.get("intent"),
    source: searchParams.get("source"),
    token: searchParams.get("token"),
  });
}

export function readOnboardingContextFromRecord(searchParams: SearchParamRecord): OnboardingActivationContext {
  const parsedSearch = onboardingActivationSearchSchema.safeParse({
    source: firstSearchParam(searchParams.source),
    token: firstSearchParam(searchParams.token),
  });
  if (!parsedSearch.success || parsedSearch.data.source !== "public_card" || !parsedSearch.data.token) {
    return { kind: "default" };
  }
  return { kind: "public_card", token: parsedSearch.data.token };
}

export function buildOnboardingPublicCardHref(token: string): string {
  const searchParams = new URLSearchParams();
  searchParams.set("source", "public_card");
  searchParams.set("token", token);
  return `/onboarding?${searchParams.toString()}`;
}

export function buildDashboardActivationHref(intent: DashboardActivationIntent): string {
  switch (intent.kind) {
    case "none":
      return "/dashboard";
    case "first_card": {
      const searchParams = new URLSearchParams();
      searchParams.set("intent", "first_card");
      searchParams.set("source", intent.source);
      if (intent.token) {
        searchParams.set("token", intent.token);
      }
      return `/dashboard?${searchParams.toString()}`;
    }
    default:
      return assertNever(intent);
  }
}

export function buildFirstCardActivationIntent(context: OnboardingActivationContext): DashboardActivationIntent {
  switch (context.kind) {
    case "default":
      return { kind: "first_card", source: "onboarding", token: null };
    case "public_card":
      return { kind: "first_card", source: "public_card", token: context.token };
    default:
      return assertNever(context);
  }
}

function readActivation(input: {
  readonly intent: string | null;
  readonly source: string | null;
  readonly token: string | null;
}): DashboardActivationIntent {
  const parsedSearch = dashboardActivationSearchSchema.safeParse(input);
  if (!parsedSearch.success || parsedSearch.data.intent !== "first_card" || !parsedSearch.data.source) {
    return { kind: "none" };
  }

  return {
    kind: "first_card",
    source: parsedSearch.data.source,
    token: parsedSearch.data.token,
  };
}
