import { AuthGateClient } from "@/components/auth-gate-client";
import { sanitizeAuthRedirect } from "@/lib/auth-redirect";

type AuthPageProps = {
  readonly searchParams: Promise<Record<string, string | readonly string[] | undefined>>;
};

function readSearchValue(value: string | readonly string[] | undefined): string | null {
  if (typeof value === "string") {
    return value;
  }

  return value?.at(0) ?? null;
}

export default async function AuthPage({ searchParams }: AuthPageProps) {
  const resolvedSearchParams = await searchParams;
  const redirectTo = sanitizeAuthRedirect(readSearchValue(resolvedSearchParams.redirect));

  return (
    <AuthGateClient
      redirectTo={redirectTo}
      supabaseUrl={process.env.NEXT_PUBLIC_SUPABASE_URL ?? null}
      supabaseAnonKey={process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? null}
    />
  );
}
