import { z } from "zod";

export const supportCategorySchema = z.enum([
  "payment_failed",
  "cancel_subscription",
  "refund_request",
  "account_help",
]);

export type SupportCategory = z.infer<typeof supportCategorySchema>;

export const supportCategoryLabels = {
  payment_failed: "결제 실패",
  cancel_subscription: "구독 취소",
  refund_request: "환불 요청",
  account_help: "계정/기록 도움",
} satisfies Record<SupportCategory, string>;

export const supportRequestSchema = z.object({
  email: z.string().email(),
  category: supportCategorySchema,
  message: z.string().min(10).max(2000),
  checkoutSessionId: z.string().trim().max(120).optional(),
  subscriptionId: z.string().trim().max(120).optional(),
});

export const supportResponseSchema = z.object({
  data: z.object({
    ticketId: z.string().min(1),
  }),
});

export type SupportRequestPayload = z.infer<typeof supportRequestSchema>;
export type SupportResponsePayload = z.infer<typeof supportResponseSchema>;

export function supportCategoryLabel(category: SupportCategory): string {
  return supportCategoryLabels[category];
}
