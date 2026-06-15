import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { readStarterEnv } from "@/lib/env";

export async function createStarterServerClient(url: string, anonKey: string) {
  const cookieStore = await cookies();

  return createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          cookieStore.set(name, value, options);
        });
      },
    },
  });
}

export async function createServerSupabase() {
  const env = readStarterEnv(process.env);
  return createStarterServerClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}
