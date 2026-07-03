"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AlertCircle, ChevronRight } from "lucide-react";
import { z } from "zod";
import confetti from "canvas-confetti";
import { FlavorRadarChart } from "@/components/flavor-radar-chart";
import { FigmaDashboardShell } from "@/components/figma-dashboard-shell";
import { publicTastingCardSchema, type PublicTastingCard } from "@/lib/public-card";

type QuizClientProps = {
  readonly token: string;
};

type QuizState =
  | { readonly kind: "loading" }
  | { readonly kind: "ready"; readonly card: PublicTastingCard }
  | { readonly kind: "error"; readonly message: string };

const publicCardResponseSchema = z.object({
  data: publicTastingCardSchema.optional(),
  error: z.object({ message: z.string().optional() }).optional(),
});

// A small predefined list of fake tags to generate wrong answers
const FAKE_TAGS = ["다크초콜릿", "자몽", "구운아몬드", "베리류", "재스민", "캐러멜", "홍차", "레몬", "와이니", "밀크초콜릿"];

export default function QuizClient({ token }: QuizClientProps) {
  const [state, setState] = useState<QuizState>({ kind: "loading" });
  const [hasGuessed, setHasGuessed] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [options, setOptions] = useState<string[]>([]);

  useEffect(() => {
    let isMounted = true;

    async function fetchCard(): Promise<void> {
      try {
        const response = await fetch(`/api/v1/public/cards/${encodeURIComponent(token)}`);
        const parsedResponse = publicCardResponseSchema.safeParse(await response.json());
        if (!isMounted) return;
        
        if (!response.ok || !parsedResponse.success || !parsedResponse.data.data) {
          setState({ kind: "error", message: "공개 카드를 찾을 수 없습니다." });
          return;
        }
        
        const card = parsedResponse.data.data;
        setState({ kind: "ready", card });

        // Generate options: 1 correct (first tag), 2 random
        const correctTag = card.tags[0] || "스페셜티";
        const randomFakes = FAKE_TAGS.filter(t => t !== correctTag).sort(() => 0.5 - Math.random()).slice(0, 2);
        const shuffledOptions = [correctTag, ...randomFakes].sort(() => 0.5 - Math.random());
        setOptions(shuffledOptions);

      } catch (error: unknown) {
        if (!isMounted) return;
        if (error instanceof Error) {
          setState({ kind: "error", message: error.message });
          return;
        }
      }
    }

    void fetchCard();
    return () => {
      isMounted = false;
    };
  }, [token]);

  const handleGuess = (selectedOption: string) => {
    if (state.kind !== "ready" || hasGuessed) return;
    
    const correctTag = state.card.tags[0] || "스페셜티";
    const correct = selectedOption === correctTag;
    
    setIsCorrect(correct);
    setHasGuessed(true);

    if (correct) {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ["#C58948", "#19140F", "#F7F7F4"]
      });
    }
  };

  return (
    <FigmaDashboardShell
      activeHref="/"
      compact
      description="친구가 남긴 공개 카드에서 메인 향미를 맞춰보고, 내 기록으로 이어가요."
      eyebrow="Blind Tasting Quiz"
      title="컵 안의 노트 맞히기"
    >
      <div className="w-full max-w-md space-y-6">
        {state.kind === "loading" && (
          <section className="dashboard-panel p-10 text-center text-sm text-muted-foreground">
            퀴즈를 준비 중입니다...
          </section>
        )}

        {state.kind === "error" && (
          <section className="rounded-3xl border border-red-200 bg-red-50 p-10 text-center">
            <AlertCircle size={28} className="mx-auto text-red-500" />
            <h1 className="mt-3 font-serif text-xl font-bold">퀴즈를 찾을 수 없습니다</h1>
            <p className="mt-2 text-xs text-muted-foreground/60">{state.message}</p>
          </section>
        )}

        {state.kind === "ready" && (
          <section className="dashboard-panel flex flex-col items-center overflow-hidden p-6 text-center">
            <h1 className="font-serif text-2xl font-extrabold leading-tight text-foreground mb-2">
              친구가 마신 커피의 메인 노트는 무엇일까요?
            </h1>
            <p className="text-xs font-bold text-muted-foreground mb-6">
              {state.card.title} ({state.card.subtitle})
            </p>

            <div className="relative mb-8 flex aspect-square w-full flex-col items-center justify-center overflow-hidden rounded-[2rem] bg-[var(--surface-muted)]/45 shadow-inner">
              <FlavorRadarChart 
                metric1={state.card.metric1} 
                metric2={state.card.metric2} 
                metric3={state.card.metric3} 
                metric4={state.card.metric4 ?? 3}
                metric5={state.card.metric5 ?? 3}
                metric6={state.card.metric6 ?? 3}
              />
              {!hasGuessed && (
                <div className="absolute inset-0 flex items-center justify-center bg-[rgba(41,25,18,0.34)] backdrop-blur-[2px] pointer-events-none">
                  <span className="bg-primary-amber text-[#0D0A07] px-3 py-1 rounded-full text-xs font-bold tracking-widest uppercase shadow-xl">
                    Guess The Note
                  </span>
                </div>
              )}
            </div>

            {!hasGuessed ? (
              <div className="w-full flex flex-col gap-3">
                {options.map((opt, i) => (
                  <button 
                    key={i} 
                    onClick={() => handleGuess(opt)}
                    className="w-full rounded-2xl border border-[var(--border)] bg-[var(--surface)] py-4 text-sm font-bold text-foreground shadow-sm transition-all hover:border-primary-amber/30 hover:bg-primary-amber/10"
                  >
                    {opt}
                  </button>
                ))}
              </div>
            ) : (
              <div className="w-full flex flex-col items-center animate-in fade-in slide-in-from-bottom-4 duration-500">
                <h2 className="text-2xl font-bold mb-2">
                  {isCorrect ? "정답입니다!" : "아쉬워요!"}
                </h2>
                <p className="text-sm text-foreground/80 mb-6">
                  실제 메인 노트는 <span className="font-extrabold text-primary-amber">{state.card.tags[0] || "스페셜티"}</span> 였습니다.
                </p>

                <div className="w-full rounded-2xl border border-primary-amber/30 bg-primary-amber/5 p-5 text-left mb-6">
                  <p className="text-[10px] font-extrabold uppercase tracking-widest text-primary-amber mb-2">Taste Card Loop</p>
                  <h3 className="font-serif text-base font-bold text-foreground">당신도 훌륭한 미각을 가졌군요!</h3>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground/60 mb-4">
                    나만의 스페셜티 커피 여권을 만들고 친구들과 공유해보세요.
                  </p>
                  <Link
                    href="/"
                    className="w-full inline-flex items-center justify-center gap-1.5 rounded-xl bg-primary-amber px-4 py-3 text-sm font-bold text-[#0D0A07] shadow-sm transition hover:opacity-90"
                  >
                    내 Taste Passport 만들기
                    <ChevronRight size={15} />
                  </Link>
                </div>
              </div>
            )}
          </section>
        )}
      </div>
    </FigmaDashboardShell>
  );
}
