"use client";

import { useEffect, useMemo, useState } from "react";
import { Coffee } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createStarterBrowserClient } from "@/lib/supabase/browser";

type AuthGateClientProps = {
  readonly redirectTo: string;
  readonly supabaseUrl: string | null;
  readonly supabaseAnonKey: string | null;
};

type AuthAction = "google";

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
        case "google": {
          const redirectToUrl = `${globalThis.location.origin}/auth/callback?next=${encodeURIComponent(redirectTo)}`;
          const { error } = await authClient.auth.signInWithOAuth({
            provider: "google",
            options: {
              redirectTo: redirectToUrl,
            },
          });
          if (error) {
            setFormError(error.message);
            return;
          }
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
      className="min-h-[100dvh] bg-[var(--background)] px-4 py-5 text-foreground sm:grid sm:place-items-center"
    >
      <section className="mx-auto flex min-h-[calc(100dvh-2.5rem)] w-full max-w-md flex-col justify-center rounded-[1.75rem] border border-white/12 bg-white/[0.06] p-6 shadow-[0_24px_70px_rgba(0,0,0,0.36)] sm:min-h-0 md:p-8">
        <div className="space-y-3 text-center">
          <div className="mx-auto flex size-14 items-center justify-center rounded-[1.1rem] bg-primary-amber/16 text-primary-amber ring-1 ring-primary-amber/24">
            <Coffee size={20} aria-hidden="true" />
          </div>
          <p className="text-[10px] font-black uppercase tracking-[0.24em] text-primary-amber">CoffeeDex</p>
          <h1 className="break-keep font-serif text-3xl font-black leading-tight text-[#FFF8EC]">CoffeeDex 계정으로 계속하기</h1>
          <p className="mx-auto max-w-sm break-keep text-sm font-semibold leading-6 text-muted-foreground">
            Google 계정으로 로그인하면 방금 보던 커피 기록으로 이어집니다.
          </p>
        </div>

        {!isConfigured && (
          <div className="mt-5 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-900">
            Supabase 공개 환경 변수가 없어 인증 기능이 비활성화되었습니다. NEXT_PUBLIC_SUPABASE_URL과
            NEXT_PUBLIC_SUPABASE_ANON_KEY를 설정하면 로그인과 회원가입을 사용할 수 있습니다.
          </div>
        )}

        <div className="mt-6 flex flex-col gap-3">
          <Button
            type="button"
            disabled={!isConfigured || isSubmitting}
            onClick={() => void runAuthAction("google")}
            className="flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl border border-white/12 bg-[#FFF8EC] py-3 text-[#120B07] shadow-[0_14px_30px_rgba(0,0,0,0.24)] hover:bg-white"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            <span className="font-semibold text-[15px]">Google로 계속하기</span>
          </Button>

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

          {process.env.NODE_ENV === "development" && (
            <div className="mt-6 border-t border-white/10 pt-4">
              <Button
                type="button"
                onClick={() => {
                  // Mock test mode bypass
                  localStorage.setItem("mock_test_mode", "true");
                  globalThis.location.assign(redirectTo);
                }}
                className="w-full rounded-2xl border border-white/12 bg-white/[0.08] text-[#FFF8EC] hover:bg-white/[0.12]"
              >
                테스트 계정으로 바로 입장하기 (Mock)
              </Button>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
