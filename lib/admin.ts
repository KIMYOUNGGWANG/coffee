import { createAdminSupabase } from "@/lib/supabase/admin";
import { createServerSupabase } from "@/lib/supabase/server";

type AdminAuthSuccess = {
  readonly ok: true;
  readonly user: {
    readonly id: string;
    readonly email: string | null;
  };
  readonly source: "email_allowlist" | "profile_role";
};

type AdminAuthFailure = {
  readonly ok: false;
  readonly status: 401 | 403;
  readonly message: string;
};

export type AdminAuthResult = AdminAuthSuccess | AdminAuthFailure;

function normalizeEmail(email: string | null | undefined): string {
  return email?.trim().toLowerCase() ?? "";
}

export function readAdminEmailAllowlist(rawAllowlist: string | undefined): ReadonlySet<string> {
  const emails = (rawAllowlist ?? "")
    .split(/[\s,;]+/)
    .map((email) => normalizeEmail(email))
    .filter((email) => email.length > 0);

  return new Set(emails);
}

export async function requireAdmin(): Promise<AdminAuthResult> {
  const supabase = await createServerSupabase();
  const { data, error } = await supabase.auth.getUser();
  const user = data.user;

  if (error || !user) {
    return {
      ok: false,
      status: 401,
      message: "관리자 화면을 보려면 로그인이 필요합니다.",
    };
  }

  const email = normalizeEmail(user.email);
  const allowlist = readAdminEmailAllowlist(process.env.ADMIN_EMAIL_ALLOWLIST);
  if (email.length > 0 && allowlist.has(email)) {
    return {
      ok: true,
      user: { id: user.id, email },
      source: "email_allowlist",
    };
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single();

  if (profileError || profile?.is_admin !== true) {
    return {
      ok: false,
      status: 403,
      message: "CoffeeDex 관리자 권한이 필요합니다.",
    };
  }

  return {
    ok: true,
    user: { id: user.id, email: email.length > 0 ? email : null },
    source: "profile_role",
  };
}

export function createAdminDataClient() {
  return createAdminSupabase();
}
