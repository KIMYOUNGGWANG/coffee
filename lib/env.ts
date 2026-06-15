import { z } from "zod";

const starterEnvSchema = z.object({
  NEXT_PUBLIC_APP_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  STRIPE_SECRET_KEY: z.string().min(1),
  STRIPE_WEBHOOK_SECRET: z.string().min(1),
  RESEND_API_KEY: z.string().min(1),
  NEXT_PUBLIC_POSTHOG_KEY: z.string().min(1),
  NEXT_PUBLIC_SENTRY_DSN: z.string().min(1),
  STORAGE_BUCKET_UPLOADS: z.string().min(1),
  AI_API_KEY: z.string().optional(),
});

export type StarterEnv = z.infer<typeof starterEnvSchema>;

export function readStarterEnv(rawEnv: Record<string, string | undefined>) {
  return starterEnvSchema.parse(rawEnv);
}
