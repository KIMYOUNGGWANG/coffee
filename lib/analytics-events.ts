import { z } from "zod";

export const analyticsEventNames = [
  "landing_view",
  "pricing_viewed",
  "pricing_cta_clicked",
  "dashboard_view",
  "first_card_cta_clicked",
  "paywall_opened",
  "checkout_started",
  "checkout_failed",
  "subscription_status_viewed",
  "billing_support_started",
  "support_request_submitted",
  "story_downloaded",
  "story_share_started",
  "public_share_link_copied",
  "public_card_view",
] as const;

export type AnalyticsEventName = (typeof analyticsEventNames)[number];

const analyticsPropertySchema = z.union([z.string(), z.number(), z.boolean(), z.null()]);

export const analyticsEventSchema = z.object({
  eventName: z.enum(analyticsEventNames),
  occurredAt: z.string().datetime(),
  path: z.string().min(1),
  properties: z.record(analyticsPropertySchema).default({}),
});

export type AnalyticsEventPayload = z.infer<typeof analyticsEventSchema>;
