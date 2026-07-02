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
  "public_card_cta_clicked",
  "scan_started",
  "scan_result_returned",
  "scan_failed",
  "oauth_failed",
  "card_save_failed",
  "shelf_save_failed",
  "brewing_log_save_failed",
  "checkout_webhook_failed",
  "scan_field_edited",
  "draft_confirmed",
  "card_saved",
  "archive_viewed",
  "archive_searched",
  "second_bag_recorded",
  "third_bag_recorded",
  "share_card_clicked",
  "ai_scan_success",
] as const;

export type AnalyticsEventName = (typeof analyticsEventNames)[number];

const sensitivePropertyKey = /(^|_)(email|image|note)($|_)/i;
const analyticsPropertyKeySchema = z
  .string()
  .min(1)
  .max(64)
  .regex(/^[a-z][a-z0-9_]*$/)
  .refine((key) => !sensitivePropertyKey.test(key), "Sensitive analytics property key.");
const analyticsPropertySchema = z.union([
  z.string().max(256),
  z.number().finite().min(-1_000_000_000).max(1_000_000_000),
  z.boolean(),
  z.null(),
]);
const analyticsPropertiesSchema = z
  .record(analyticsPropertyKeySchema, analyticsPropertySchema)
  .refine((properties) => Object.keys(properties).length <= 20, "Too many analytics properties.");

export const analyticsEventSchema = z
  .object({
    eventId: z.string().uuid().default(() => crypto.randomUUID()),
    eventName: z.enum(analyticsEventNames),
    occurredAt: z.string().datetime(),
    path: z.string().min(1).max(2_048).regex(/^\/[^?#]*$/),
    anonymousId: z.string().min(1).max(128).regex(/^[A-Za-z0-9._:-]+$/).nullable().optional(),
    properties: analyticsPropertiesSchema.default({}),
  })
  .strict();

export type AnalyticsEventPayload = Readonly<z.infer<typeof analyticsEventSchema>>;
