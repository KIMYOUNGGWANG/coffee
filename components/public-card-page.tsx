"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AlertCircle, ChevronRight, Coffee, Home, Sparkles } from "lucide-react";
import { z } from "zod";
import { useAnalyticsEvents } from "@/hooks/use-analytics-events";
import { buildOnboardingPublicCardHref } from "@/lib/activation-intent";
import { hyangmiBrand } from "@/lib/brand";
import { publicTastingCardSchema, type PublicTastingCard } from "@/lib/public-card";

type PublicCardPageProps = {
  readonly token: string;
};

type PublicCardState =
  | { readonly kind: "loading" }
  | { readonly kind: "ready"; readonly card: PublicTastingCard }
  | { readonly kind: "error"; readonly message: string };

const publicCardResponseSchema = z.object({
  data: publicTastingCardSchema.optional(),
  error: z.object({ message: z.string().optional() }).optional(),
});

function metricLabel(label: string, value: number) {
  return (
    <div className="rounded-2xl border border-warm-gray bg-white/70 p-3">
      <p className="text-[10px] font-bold uppercase tracking-wider text-espresso/45">{label}</p>
      <p className="mt-1 text-xl font-serif font-bold text-espresso">{value} / 5</p>
    </div>
  );
}

export default function PublicCardPage({ token }: PublicCardPageProps) {
  const [state, setState] = useState<PublicCardState>({ kind: "loading" });
  const { trackEvent } = useAnalyticsEvents();

  useEffect(() => {
    let isMounted = true;

    async function fetchCard(): Promise<void> {
      try {
        const response = await fetch(`/api/v1/public/cards/${encodeURIComponent(token)}`);
        const parsedResponse = publicCardResponseSchema.safeParse(await response.json());
        if (!isMounted) {
          return;
        }
        if (!response.ok || !parsedResponse.success || !parsedResponse.data.data) {
          setState({ kind: "error", message: parsedResponse.success ? parsedResponse.data.error?.message ?? "공개 카드를 찾을 수 없습니다." : "공개 카드 응답이 올바르지 않습니다." });
          return;
        }
        setState({ kind: "ready", card: parsedResponse.data.data });
        trackEvent("public_card_view", { token });
      } catch (error: unknown) {
        if (!isMounted) {
          return;
        }
        if (error instanceof Error) {
          setState({ kind: "error", message: error.message });
          return;
        }
        throw error;
      }
    }

    void fetchCard();
    return () => {
      isMounted = false;
    };
  }, [token, trackEvent]);

  return (
    <main className="min-h-screen bg-[#f7f7f4] text-espresso p-4 md:p-10">
      <div className="mx-auto max-w-4xl space-y-6">
        <header className="flex items-center justify-between rounded-3xl border border-warm-gray bg-white/70 px-5 py-4 shadow-sm">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-caramel text-cream">
              <Coffee size={17} />
            </div>
            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-widest text-caramel">Hyangmi 공개 테이스팅 카드</p>
              <p className="font-serif text-sm font-bold">Korea-first coffee memory</p>
            </div>
          </div>
          <Link href="/" className="inline-flex items-center gap-1.5 rounded-xl border border-warm-gray bg-white px-3 py-2 text-xs font-bold text-espresso/70 transition hover:text-espresso">
            <Home size={13} />
            {hyangmiBrand.name}
          </Link>
        </header>

        {state.kind === "loading" && (
          <section className="rounded-3xl border border-warm-gray bg-white p-10 text-center text-sm text-espresso/55">
            공개 카드를 불러오는 중입니다.
          </section>
        )}

        {state.kind === "error" && (
          <section className="rounded-3xl border border-red-200 bg-red-50 p-10 text-center">
            <AlertCircle size={28} className="mx-auto text-red-500" />
            <h1 className="mt-3 font-serif text-xl font-bold">공개 카드를 찾을 수 없습니다</h1>
            <p className="mt-2 text-xs text-espresso/60">{state.message}</p>
          </section>
        )}

        {state.kind === "ready" && (
          <section className="overflow-hidden rounded-[2rem] border border-warm-gray bg-cream shadow-sm">
            <div className="grid gap-0 md:grid-cols-[0.95fr_1.05fr]">
              <div className="min-h-[360px] bg-white/60 p-8 flex items-center justify-center">
                {state.card.image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={state.card.image_url} alt={state.card.title} className="max-h-[460px] w-full rounded-3xl object-cover shadow-md" />
                ) : (
                  <div className="flex h-64 w-full max-w-xs flex-col items-center justify-center rounded-3xl border border-warm-gray bg-white text-caramel">
                    <Coffee size={54} strokeWidth={1.4} />
                    <span className="mt-3 text-xs font-bold uppercase tracking-widest">Bean Memory</span>
                  </div>
                )}
              </div>
              <div className="p-8 md:p-10 space-y-6">
                <div>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-caramel/10 px-3 py-1 text-[10px] font-extrabold uppercase tracking-widest text-caramel">
                    <Sparkles size={11} />
                    {state.card.badges[0] ?? hyangmiBrand.name}
                  </span>
                  <h1 className="mt-4 font-serif text-4xl font-extrabold leading-tight text-espresso">{state.card.title}</h1>
                  <p className="mt-2 text-sm font-bold text-espresso/55">{state.card.subtitle}</p>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  {metricLabel("Acidity", state.card.metric1)}
                  {metricLabel("Sweetness", state.card.metric2)}
                  {metricLabel("Body", state.card.metric3)}
                </div>

                <p className="rounded-3xl border border-warm-gray bg-white/70 p-5 font-serif text-sm italic leading-relaxed text-espresso/80">
                  “{state.card.ai_description || "사용자가 확인한 Hyangmi 테이스팅 기록입니다."}”
                </p>

                <div className="flex flex-wrap gap-2">
                  {state.card.tags.slice(0, 5).map((tag) => (
                    <span key={tag} className="rounded-full border border-warm-gray bg-white px-3 py-1 text-[11px] font-bold text-espresso/65">#{tag}</span>
                  ))}
                </div>
              </div>
            </div>
          </section>
        )}

        {state.kind === "ready" && (
          <section className="rounded-3xl border border-warm-gray bg-white px-5 py-4 shadow-sm">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-[10px] font-extrabold uppercase tracking-widest text-caramel">Taste Card Loop</p>
                <h2 className="mt-1 font-serif text-lg font-bold text-espresso">내 커피 취향도 카드로 남기기</h2>
                <p className="mt-1 text-xs leading-relaxed text-espresso/55">
                  마신 원두를 저장하면 공유 카드와 Taste Passport로 이어집니다.
                </p>
              </div>
              <Link
                href={buildOnboardingPublicCardHref(token)}
                className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-espresso px-4 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-espresso/90"
              >
                내 Hyangmi Taste Card 만들기
                <ChevronRight size={13} />
              </Link>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
