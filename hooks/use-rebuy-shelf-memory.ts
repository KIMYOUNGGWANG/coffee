import { useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";

import type { RebuyShelfTransferPayload } from "@/lib/rebuy-shelf-transfer";

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

function getResponseErrorMessage(json: unknown): string {
  const result = responseErrorSchema.safeParse(json);
  const message = result.success ? result.data.error?.message : undefined;
  return typeof message === "string" && message.trim().length > 0 ? message : "새 원두를 선반에 저장하지 못했습니다.";
}

export function useStartRebuyShelfMemory() {
  const queryClient = useQueryClient();

  return useMutation<unknown, Error, RebuyShelfTransferPayload>({
    mutationFn: async (payload) => {
      const response = await fetch("/api/v1/shelf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await readJsonResponse(response);

      if (!response.ok) {
        throw new Error(getResponseErrorMessage(json));
      }

      return json;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["rebuy-intelligence"] });
    },
  });
}
