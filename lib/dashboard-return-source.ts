import { z } from "zod";

const dashboardReturnSourceSearchSchema = z.object({
  source: z.literal("rebuy_calendar").nullable(),
  rebuyToken: z.string().uuid().nullable().catch(null),
});

export type DashboardReturnSource =
  | { readonly kind: "rebuy_calendar"; readonly source: "rebuy_calendar"; readonly returnToken: string | null }
  | { readonly kind: "none" };

type SearchParamRecord = Record<string, string | readonly string[] | undefined>;

function firstSearchParam(value: string | readonly string[] | undefined): string | null {
  if (typeof value === "string") {
    return value;
  }
  return value?.[0] ?? null;
}

export function readDashboardReturnSourceFromRecord(searchParams: SearchParamRecord): DashboardReturnSource {
  const parsedSearch = dashboardReturnSourceSearchSchema.safeParse({
    source: firstSearchParam(searchParams.source),
    rebuyToken: firstSearchParam(searchParams.rebuy_token),
  });

  if (!parsedSearch.success || parsedSearch.data.source !== "rebuy_calendar") {
    return { kind: "none" };
  }

  return { kind: "rebuy_calendar", source: "rebuy_calendar", returnToken: parsedSearch.data.rebuyToken };
}
