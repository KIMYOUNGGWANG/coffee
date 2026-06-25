import { z } from "zod";

export const publicCardFooterMetaSchema = z.object({
  origin: z.string().optional(),
  date: z.string().optional(),
  extraInfo: z.string().optional(),
}).default({});

export const publicTastingCardSchema = z.object({
  id: z.string().min(1),
  category: z.enum(["coffee", "beer", "whiskey", "wine"]),
  title: z.string().min(1),
  subtitle: z.string().min(1),
  image_url: z.string().nullable(),
  badges: z.array(z.string()).default([]),
  metric1: z.number().int().min(1).max(5),
  metric2: z.number().int().min(1).max(5),
  metric3: z.number().int().min(1).max(5),
  metric4: z.number().int().min(1).max(5).optional(),
  metric5: z.number().int().min(1).max(5).optional(),
  metric6: z.number().int().min(1).max(5).optional(),
  tags: z.array(z.string()).default([]),
  ai_description: z.string().default(""),
  footer_meta: publicCardFooterMetaSchema,
  public_share_token: z.string().min(1),
  created_at: z.string().min(1),
  updated_at: z.string().min(1),
});

export type PublicTastingCard = z.infer<typeof publicTastingCardSchema>;

export function createPublicCardUrl(origin: string, publicShareToken: string): string {
  return `${origin.replace(/\/$/, "")}/cards/${encodeURIComponent(publicShareToken)}`;
}
