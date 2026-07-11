import { useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";

import type { RebuyShelfTransferPayload } from "@/lib/rebuy-shelf-transfer";

const responseErrorSchema = z.object({
  error: z.object({
    message: z.string().optional(),
  }).optional(),
});

const responseSchema = z.object({
  data: z.unknown(),
  reused: z.boolean().optional().default(false),
});

export type RebuyShelfMemoryResult = Readonly<z.infer<typeof responseSchema>>;

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

  return useMutation<RebuyShelfMemoryResult, Error, RebuyShelfTransferPayload>({
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

      const parsed = responseSchema.safeParse(json);
      if (!parsed.success) {
        throw new Error("새 원두 저장 결과를 확인하지 못했습니다.");
      }

      return parsed.data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["rebuy-intelligence"] });
    },
  });
}
