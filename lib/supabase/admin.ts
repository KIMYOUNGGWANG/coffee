import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

const adminSupabaseEnvSchema = z
  .object({
    NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
    SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  })
  .readonly();

export class AdminSupabaseConfigurationError extends Error {
  readonly issues: z.ZodIssue[];

  constructor(issues: z.ZodIssue[]) {
    super("Supabase admin credentials are unavailable");
    this.name = "AdminSupabaseConfigurationError";
    this.issues = issues;
  }
}

export function createAdminSupabase(rawEnv: NodeJS.ProcessEnv = process.env) {
  const parsed = adminSupabaseEnvSchema.safeParse(rawEnv);
  if (!parsed.success) {
    throw new AdminSupabaseConfigurationError(parsed.error.issues);
  }

  return createClient(parsed.data.NEXT_PUBLIC_SUPABASE_URL, parsed.data.SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
