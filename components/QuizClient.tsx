"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AlertCircle, ChevronRight, Coffee, Home, Sparkles } from "lucide-react";
import { z } from "zod";
import confetti from "canvas-confetti";
import FluidRadarChart from "@/components/FluidRadarChart";
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
    <main className="min-h-screen bg-[#0D0A07] text-foreground p-4 md:p-10 flex flex-col items-center justify-center">
      <div className="w-full max-w-md space-y-6">
        <header className="flex items-center justify-between rounded-3xl border border-white/10 bg-white/5 px-5 py-4 shadow-sm">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-primary-amber text-[#0D0A07]">
              <Coffee size={17} />
            </div>
            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-widest text-primary-amber">Blind Tasting Quiz</p>
              <p className="font-serif text-sm font-bold">What's in the cup?</p>
            </div>
          </div>
        </header>

        {state.kind === "loading" && (
          <section className="rounded-3xl border border-white/10 bg-white/5 p-10 text-center text-sm text-muted-foreground">
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
          <section className="overflow-hidden rounded-[2rem] border border-white/10 glass-card shadow-sm p-6 flex flex-col items-center text-center">
            <h1 className="font-serif text-2xl font-extrabold leading-tight text-foreground mb-2">
              친구가 마신 커피의 메인 노트는 무엇일까요?
            </h1>
            <p className="text-xs font-bold text-muted-foreground mb-6">
              {state.card.title} ({state.card.subtitle})
            </p>

            <div className="relative w-full aspect-square bg-white/5 rounded-[2rem] flex flex-col items-center justify-center shadow-inner mb-8 overflow-hidden">
              <FluidRadarChart 
                acidity={state.card.metric1} 
                sweetness={state.card.metric2} 
                body={state.card.metric3} 
                size={220}
                hideLabels={!hasGuessed}
              />
              {!hasGuessed && (
                <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] pointer-events-none flex items-center justify-center">
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
                    className="w-full py-4 rounded-2xl border border-white/10 bg-white/5 text-foreground font-bold text-sm hover:bg-primary-amber/10 hover:border-primary-amber/30 transition-all shadow-sm"
                  >
                    {opt}
                  </button>
                ))}
              </div>
            ) : (
              <div className="w-full flex flex-col items-center animate-in fade-in slide-in-from-bottom-4 duration-500">
                <h2 className="text-2xl font-bold mb-2">
                  {isCorrect ? "🎉 정답입니다!" : "아쉬워요!"}
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
    </main>
  );
}
