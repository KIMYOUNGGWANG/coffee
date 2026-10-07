"use client";

import React, { useState, useEffect } from "react";
import { Coffee, ChevronRight, Archive, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

type GamePhase = "drawer" | "brewing" | "tasting" | "collection";

interface Bean {
  id: string;
  name: string;
  roaster: string;
  notes: string[];
}

interface Memory {
  bean: Bean;
  mood: string;
  note: string;
  date: string;
}

const BEANS: Bean[] = [
  { id: "1", name: "Fritz Ethiopia Sidama", roaster: "Fritz", notes: ["Jasmine", "Peach", "Honey"] },
  { id: "2", name: "Anthracite William Blake", roaster: "Anthracite", notes: ["Dark Chocolate", "Walnut", "Heavy Body"] },
  { id: "3", name: "Momos Esmeralda Geisha", roaster: "Momos", notes: ["Bergamot", "Orange Blossom", "Tea-like"] },
];

const MOODS = [
  { id: "calm", label: "차분한", color: "bg-surface-strong text-accent-foreground" },
  { id: "focused", label: "집중하는", color: "bg-surface-strong text-accent-foreground" },
  { id: "relaxed", label: "여유로운", color: "bg-surface-strong text-accent-foreground" },
  { id: "inspired", label: "영감받은", color: "bg-surface-strong text-accent-foreground" },
];

export default function CozyRoomMinigame() {
  const [phase, setPhase] = useState<GamePhase>("drawer");
  const [selectedBean, setSelectedBean] = useState<Bean | null>(null);
  const [brewProgress, setBrewProgress] = useState(0);
  const [memories, setMemories] = useState<Memory[]>([]);
  const [currentMood, setCurrentMood] = useState("");
  const [currentNote, setCurrentNote] = useState("");

  // Phase: Drawer
  const handleSelectBean = (bean: Bean) => {
    setSelectedBean(bean);
    setPhase("brewing");
    setBrewProgress(0);
  };

  // Phase: Brewing
  useEffect(() => {
    if (phase === "brewing") {
      const interval = setInterval(() => {
        setBrewProgress((prev) => {
          if (prev >= 100) {
            clearInterval(interval);
            setTimeout(() => setPhase("tasting"), 1000);
            return 100;
          }
          return prev + 1;
        });
      }, 50);
      return () => clearInterval(interval);
    }
  }, [phase]);

  // Phase: Tasting
  const handleSaveMemory = () => {
    if (selectedBean && currentMood) {
      setMemories([
        ...memories,
        {
          bean: selectedBean,
          mood: currentMood,
          note: currentNote,
          date: new Date().toLocaleDateString("ko-KR"),
        },
      ]);
      setPhase("collection");
      setCurrentMood("");
      setCurrentNote("");
    }
  };

  const getBrewingText = (progress: number) => {
    if (progress < 30) return "원두를 준비하는 중...";
    if (progress < 60) return "따뜻한 물을 붓고 뜸을 들이는 중...";
    if (progress < 90) return "천천히 커피를 내리는 중...";
    return "커피가 완성되었습니다.";
  };

  return (
    <div className="min-h-screen bg-[#F7EFE2] text-[#291912] font-sans selection:bg-[#BD7650]/20 flex flex-col items-center justify-center p-6 sm:p-12">
      <div className="w-full max-w-2xl bg-[#FFF9EF] border border-[#291912]/10 rounded-3xl shadow-sm overflow-hidden min-h-[600px] flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[#291912]/5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#EFE0CC] text-[#291912]">
              <Coffee size={20} strokeWidth={2} />
            </div>
            <div>
              <h1 className="font-serif text-xl font-bold tracking-tight">나만의 커피룸</h1>
              <p className="text-xs text-[#7C6454] font-medium">따뜻하고 조용한 시간</p>
            </div>
          </div>
          <button
            onClick={() => setPhase("collection")}
            className="flex items-center gap-2 px-4 py-2 rounded-full border border-[#291912]/10 text-sm font-bold text-[#7C6454] hover:bg-[#EFE0CC]/50 transition-colors"
          >
            <Archive size={16} />
            내 서랍 ({memories.length})
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 p-6 flex flex-col">

          {phase === "drawer" && (
            <div className="flex-1 flex flex-col animate-in fade-in duration-700">
              <div className="mb-8 text-center mt-4">
                <h2 className="text-2xl font-bold mb-2">어떤 커피를 마실까요?</h2>
                <p className="text-sm text-[#7C6454]">서랍에서 오늘 기분에 맞는 원두를 꺼내보세요.</p>
              </div>
              <div className="grid gap-4 mt-auto mb-auto">
                {BEANS.map((bean) => (
                  <button
                    key={bean.id}
                    onClick={() => handleSelectBean(bean)}
                    className="flex items-center justify-between p-5 rounded-2xl border border-[#291912]/10 bg-[#FFF9EF] hover:bg-[#EFE0CC]/40 hover:-translate-y-0.5 transition-all text-left group"
                  >
                    <div>
                      <p className="text-xs font-bold text-[#BD7650] uppercase tracking-wider mb-1">{bean.roaster}</p>
                      <h3 className="font-serif text-lg font-bold text-[#291912] group-hover:text-[#372319]">{bean.name}</h3>
                      <p className="text-sm text-[#7C6454] mt-1">{bean.notes.join(" · ")}</p>
                    </div>
                    <ChevronRight className="text-[#BD7650] opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {phase === "brewing" && (
            <div className="flex-1 flex flex-col items-center justify-center animate-in fade-in duration-700">
              <div className="w-32 h-32 relative mb-8 flex items-center justify-center">
                {/* Simple animated brewing visual */}
                <div className="absolute inset-0 border-4 border-[#EFE0CC] rounded-full"></div>
                <svg className="absolute inset-0 w-full h-full transform -rotate-90">
                  <circle
                    cx="64"
                    cy="64"
                    r="60"
                    fill="none"
                    stroke="#BD7650"
                    strokeWidth="4"
                    strokeDasharray="377"
                    strokeDashoffset={377 - (377 * brewProgress) / 100}
                    className="transition-all duration-300 ease-linear"
                  />
                </svg>
                <Coffee size={40} className="text-[#372319] animate-pulse" />
              </div>
              <h2 className="font-serif text-xl font-bold mb-2">커피 내리는 시간</h2>
              <p className="text-sm text-[#7C6454] font-medium h-6">{getBrewingText(brewProgress)}</p>
            </div>
          )}

          {phase === "tasting" && selectedBean && (
            <div className="flex-1 flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-700">
              <div className="mb-6">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#4E7452]/10 text-[#4E7452] text-xs font-bold mb-4">
                  <Sparkles size={12} />
                  오늘의 컵
                </span>
                <h2 className="font-serif text-2xl font-bold mb-1">{selectedBean.name}</h2>
                <p className="text-sm text-[#7C6454]">따뜻한 커피가 준비되었습니다. 지금의 느낌을 기록해볼까요?</p>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-bold text-[#372319] mb-3">지금 기분은 어떤가요?</label>
                  <div className="flex flex-wrap gap-2">
                    {MOODS.map((mood) => (
                      <button
                        key={mood.id}
                        onClick={() => setCurrentMood(mood.label)}
                        className={cn(
                          "px-4 py-2 rounded-full text-sm font-bold border transition-colors",
                          currentMood === mood.label
                            ? "bg-[#372319] text-[#FFF9EF] border-[#372319]"
                            : "bg-transparent border-[#291912]/20 text-[#7C6454] hover:border-[#BD7650]/50 hover:text-[#BD7650]"
                        )}
                      >
                        {mood.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-[#372319] mb-3">기억하고 싶은 느낌</label>
                  <textarea
                    value={currentNote}
                    onChange={(e) => setCurrentNote(e.target.value)}
                    placeholder="식으니까 더 단맛이 난다, 비 오는 날 어울린다..."
                    className="w-full h-32 p-4 rounded-xl border border-[#291912]/20 bg-transparent resize-none focus:outline-none focus:border-[#BD7650] focus:ring-1 focus:ring-[#BD7650] text-sm text-[#291912] placeholder:text-[#7C6454]/50"
                  />
                </div>
              </div>

              <div className="mt-auto pt-6">
                <button
                  onClick={handleSaveMemory}
                  disabled={!currentMood}
                  className="w-full py-4 rounded-xl bg-[#BD7650] text-white font-bold text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#A66240] transition-colors"
                >
                  서랍에 조용히 저장하기
                </button>
              </div>
            </div>
          )}

          {phase === "collection" && (
            <div className="flex-1 flex flex-col animate-in fade-in duration-700">
              <div className="mb-6 flex items-end justify-between">
                <div>
                  <h2 className="font-serif text-2xl font-bold mb-1">내 원두 서랍</h2>
                  <p className="text-sm text-[#7C6454]">차곡차곡 쌓인 나만의 커피 기억들</p>
                </div>
                <button
                  onClick={() => setPhase("drawer")}
                  className="px-4 py-2 rounded-full bg-[#372319] text-[#FFF9EF] text-sm font-bold hover:bg-[#291912] transition-colors"
                >
                  새로운 커피 내리기
                </button>
              </div>

              {memories.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center">
                  <Archive className="text-[#EFE0CC] w-16 h-16 mb-4" />
                  <p className="text-[#7C6454] font-medium">아직 서랍이 비어있어요.<br/>첫 번째 커피를 내려볼까요?</p>
                </div>
              ) : (
                <div className="grid gap-4 overflow-y-auto pr-2 custom-scrollbar pb-4">
                  {memories.map((mem, i) => (
                    <div key={i} className="p-5 rounded-2xl bg-[#EFE0CC]/20 border border-[#291912]/5 relative">
                      <div className="absolute top-5 right-5 text-xs font-bold text-[#7C6454] bg-[#FFF9EF] px-2 py-1 rounded-md">
                        {mem.date}
                      </div>
                      <p className="text-xs font-bold text-[#BD7650] mb-1 uppercase tracking-wider">{mem.bean.roaster}</p>
                      <h3 className="font-serif text-lg font-bold text-[#291912] mb-3 pr-20">{mem.bean.name}</h3>

                      <div className="inline-flex items-center px-3 py-1 rounded-full bg-[#372319] text-[#FFF9EF] text-xs font-bold mb-3">
                        {mem.mood}
                      </div>

                      {mem.note && (
                        <div className="pl-3 border-l-2 border-[#BD7650]/30 text-sm text-[#372319] italic font-serif">
                          "{mem.note}"
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
