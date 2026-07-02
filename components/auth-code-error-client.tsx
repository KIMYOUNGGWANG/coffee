"use client";

import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";
import { trackAnalyticsEvent } from "@/lib/analytics-client";

export function AuthCodeErrorClient() {
  useEffect(() => {
    trackAnalyticsEvent("oauth_failed", { surface: "auth_callback" });
  }, []);

  return (
    <main className="flex min-h-[100dvh] items-center justify-center bg-black px-5 text-white">
      <section className="w-full max-w-md rounded-[32px] border border-white/10 bg-white/[0.045] p-8 text-center shadow-[0_30px_100px_rgba(0,0,0,0.4)]">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#D4AF37]/15 text-[#D4AF37]">
          <AlertTriangle className="h-7 w-7" aria-hidden="true" />
        </div>
        <h1 className="mt-6 text-3xl font-semibold tracking-tight">로그인을 완료하지 못했습니다</h1>
        <p className="mt-3 text-sm leading-7 text-[#A3A3A3]">
          Google 인증이 만료되었거나 중간에 중단되었습니다. 다시 로그인하면 CoffeeDex로 돌아갈 수 있습니다.
        </p>
        <a
          className="mt-7 inline-flex min-h-12 w-full items-center justify-center rounded-full bg-[#D4AF37] px-5 text-sm font-semibold text-[#120B07] shadow-[0_12px_36px_rgba(212,175,55,0.18)] transition hover:bg-white"
          href="/auth?redirect=/dashboard"
        >
          다시 로그인
        </a>
      </section>
    </main>
  );
}
