import { useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";

export type ShelfRebuyAction = "none" | "drank" | "will_rebuy" | "rebought";

type UpdateShelfRebuyStateInput = {
  readonly shelfItemId: string;
  readonly rebuyAction: ShelfRebuyAction;
  readonly rebuyPriority?: "normal" | "pinned" | "paused";
  readonly rebuyReminderDate?: string | null;
};

const responseErrorSchema = z.object({
  error: z.object({
    message: z.string().optional(),
  }).optional(),
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

function getResponseErrorMessage(json: unknown, fallbackMessage: string): string {
  const result = responseErrorSchema.safeParse(json);
  const message = result.success ? result.data.error?.message : undefined;
  return typeof message === "string" && message.trim().length > 0 ? message : fallbackMessage;
}

export function useUpdateShelfRebuyState() {
  const queryClient = useQueryClient();

  return useMutation<unknown, Error, UpdateShelfRebuyStateInput>({
    mutationFn: async ({ shelfItemId, rebuyAction, rebuyPriority, rebuyReminderDate }) => {
      const response = await fetch(`/api/v1/shelf/${shelfItemId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rebuyAction,
          ...(rebuyPriority !== undefined ? { rebuyPriority } : {}),
          ...(rebuyReminderDate !== undefined ? { rebuyReminderDate } : {}),
        }),
      });

      const json = await readJsonResponse(response);
      if (!response.ok) {
        throw new Error(getResponseErrorMessage(json, "재구매 상태를 저장하지 못했습니다."));
      }

      return json;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rebuy-intelligence"] });
    },
  });
}
