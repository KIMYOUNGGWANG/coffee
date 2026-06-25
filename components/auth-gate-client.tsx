"use client";

import { useEffect, useMemo, useState } from "react";
import { Coffee, LogIn, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createStarterBrowserClient } from "@/lib/supabase/browser";

type AuthGateClientProps = {
  readonly redirectTo: string;
  readonly supabaseUrl: string | null;
  readonly supabaseAnonKey: string | null;
};

type AuthAction = "signin" | "signup";

function readErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return "요청을 처리하지 못했습니다. 잠시 후 다시 시도해주세요.";
}

function assertNever(value: never): never {
  throw new Error(`Unexpected auth action: ${JSON.stringify(value)}`);
}

export function AuthGateClient({ redirectTo, supabaseUrl, supabaseAnonKey }: AuthGateClientProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pendingAction, setPendingAction] = useState<AuthAction | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isClientReady, setIsClientReady] = useState(false);

  const authClient = useMemo(() => {
    if (!supabaseUrl || !supabaseAnonKey) {
      return null;
    }

    return createStarterBrowserClient(supabaseUrl, supabaseAnonKey);
  }, [supabaseAnonKey, supabaseUrl]);

  const isConfigured = authClient !== null;
  const isSubmitting = pendingAction !== null;

  useEffect(() => {
    setIsClientReady(true);
  }, []);

  const runAuthAction = async (action: AuthAction): Promise<void> => {
    if (!authClient) {
      setFormError("Supabase 공개 환경 변수가 없어 CoffeeDex 로그인이 비활성화되었습니다.");
      return;
    }

    setPendingAction(action);
    setFormError(null);
    setStatusMessage(null);

    try {
      switch (action) {
        case "signin": {
          const { error } = await authClient.auth.signInWithPassword({ email, password });
          if (error) {
            setFormError(error.message);
            return;
          }
          globalThis.location.assign(redirectTo);
          return;
        }
        case "signup": {
          const emailRedirectTo = `${globalThis.location.origin}${redirectTo}`;
          const { data, error } = await authClient.auth.signUp({
            email,
            password,
            options: { emailRedirectTo },
          });
          if (error) {
            setFormError(error.message);
            return;
          }
          if (data.session) {
            globalThis.location.assign(redirectTo);
            return;
          }
          setStatusMessage(
            `가입 확인 메일을 보냈습니다. 메일 인증 후 CoffeeDex에 로그인해주세요. 로그인 후 이동: ${redirectTo}`,
          );
          return;
        }
        default:
          return assertNever(action);
      }
    } catch (error: unknown) {
      setFormError(readErrorMessage(error));
    } finally {
      setPendingAction(null);
    }
  };

  return (
    <main
      data-testid={isClientReady ? "auth-gate-ready" : undefined}
      className="starter-shell min-h-screen text-foreground bg-[#0D0A07]"
    >
      <section className="surface-panel mx-auto max-w-md border border-white/10 glass-card p-6 shadow-sm md:p-8">
        <div className="space-y-2 text-center">
          <div className="mx-auto flex size-11 items-center justify-center rounded-full bg-primary-amber text-[#0D0A07]">
            <Coffee size={20} aria-hidden="true" />
          </div>
          <p className="hero-kicker text-primary-amber">CoffeeDex Auth Gate</p>
          <h1 className="font-serif text-2xl font-bold text-foreground">CoffeeDex 계정으로 계속하기</h1>
          <p className="text-sm leading-6 text-foreground/65">로그인하거나 회원가입하면 내 Taste Archive로 돌아갑니다.</p>
          <p className="rounded-md border border-white/10 bg-black/40 px-3 py-2 text-xs font-semibold text-foreground/70">
            로그인 후 이동: {redirectTo}
          </p>
        </div>

        {!isConfigured && (
          <div className="mt-5 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-900">
            Supabase 공개 환경 변수가 없어 인증 기능이 비활성화되었습니다. NEXT_PUBLIC_SUPABASE_URL과
            NEXT_PUBLIC_SUPABASE_ANON_KEY를 설정하면 로그인과 회원가입을 사용할 수 있습니다.
          </div>
        )}

        <form className="mt-6 space-y-4" onSubmit={(event) => event.preventDefault()}>
          <label className="block space-y-1.5 text-sm font-semibold text-foreground" htmlFor="auth-email">
            이메일
            <input
              id="auth-email"
              type="email"
              autoComplete="email"
              value={email}
              disabled={!isConfigured || isSubmitting}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full rounded-md border border-white/10 bg-black/40 px-3 py-2 text-sm font-normal text-foreground outline-none transition focus:border-primary-amber focus:ring-4 focus:ring-caramel/20 disabled:bg-white/5"
              required
            />
          </label>

          <label className="block space-y-1.5 text-sm font-semibold text-foreground" htmlFor="auth-password">
            비밀번호
            <input
              id="auth-password"
              type="password"
              autoComplete="current-password"
              value={password}
              disabled={!isConfigured || isSubmitting}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full rounded-md border border-white/10 bg-black/40 px-3 py-2 text-sm font-normal text-foreground outline-none transition focus:border-primary-amber focus:ring-4 focus:ring-caramel/20 disabled:bg-white/5"
              required
            />
          </label>

          {formError && (
            <p role="alert" className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {formError}
            </p>
          )}

          {statusMessage && (
            <p role="status" className="rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-800">
              {statusMessage}
            </p>
          )}

          <div className="grid grid-cols-2 gap-3 mb-4">
            <Button
              type="button"
              disabled={!isConfigured || isSubmitting}
              onClick={() => void runAuthAction("signin")}
              className="bg-primary-amber text-[#0D0A07] hover:opacity-90"
            >
              <LogIn size={16} aria-hidden="true" />
              로그인
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={!isConfigured || isSubmitting}
              onClick={() => void runAuthAction("signup")}
              className="border border-white/20 bg-transparent text-foreground hover:bg-white/5 hover:text-primary-amber"
            >
              <UserPlus size={16} aria-hidden="true" />
              회원가입
            </Button>
          </div>
          
          <div className="pt-4 border-t border-white/10 mt-4">
            <Button
              type="button"
              onClick={() => {
                // Mock test mode bypass
                localStorage.setItem("mock_test_mode", "true");
                globalThis.location.assign(redirectTo);
              }}
              className="w-full bg-surface border border-white/20 text-white hover:bg-white/10"
            >
              🚀 테스트 계정으로 바로 입장하기 (Mock)
            </Button>
          </div>
        </form>
      </section>
    </main>
  );
}
