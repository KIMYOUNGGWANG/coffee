import { useQuery } from "@tanstack/react-query";
import { z } from "zod";

export type RebuyCalendarReturnItem = {
  readonly id: string;
  readonly roasterName: string | null;
  readonly beanName: string | null;
  readonly rebuyAction: "none" | "drank" | "will_rebuy" | "rebought";
};

const responseSchema = z.object({
  data: z.object({
    id: z.string().uuid(),
    roasterName: z.string().nullable(),
    beanName: z.string().nullable(),
    rebuyAction: z.enum(["none", "drank", "will_rebuy", "rebought"]),
  }),
});

async function readJsonResponse(response: Response): Promise<unknown> {
  const text = await response.text();
  if (text.trim().length === 0) return {};

  try {
    return JSON.parse(text);
  } catch {
    return {};
  }
}

export function useRebuyCalendarReturn(returnToken: string | null) {
  return useQuery<RebuyCalendarReturnItem>({
    queryKey: ["rebuy-calendar-return", returnToken],
    enabled: returnToken !== null,
    queryFn: async () => {
      const response = await fetch(`/api/v1/shelf/rebuy-return?token=${encodeURIComponent(returnToken ?? "")}`);
      const json = await readJsonResponse(response);
      const parsed = responseSchema.safeParse(json);

      if (!response.ok || !parsed.success) {
        throw new Error("재구매 기억을 불러오지 못했습니다.");
      }

      return parsed.data.data;
    },
  });
}
