import { createBrowserClient } from "@supabase/ssr";

export function createStarterBrowserClient(url: string, anonKey: string) {
  return createBrowserClient(url, anonKey);
}
