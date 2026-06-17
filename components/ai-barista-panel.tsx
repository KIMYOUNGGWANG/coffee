"use client";

import React, { useState, useEffect } from "react";
import { Sparkles, Coffee, ArrowRight, Loader2, CloudRain, Sun, Moon, BookOpen, AlertCircle, Quote } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { motion } from "motion/react";

interface ShelfItem {
  id: string;
  roaster_name: string;
  bean_name: string;
  fill_level: number;
}

interface AIBaristaPanelProps {
  refreshTrigger?: number;
}

export default function AIBaristaPanel({ refreshTrigger = 0 }: AIBaristaPanelProps) {
  const [shelfItems, setShelfItems] = useState<ShelfItem[]>([]);
  const [situation, setSituation] = useState("아침 깨어남");
  const [recommendation, setRecommendation] = useState<string>("");
  const [warningMsg, setWarningMsg] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);

  const situations = [
    { id: "아침 깨어남", label: "아침 깨어남", icon: Sun, desc: "오늘 하루의 첫 시작을 여는 커피" },
    { id: "오후 나른함", label: "오후 나른함", icon: ArrowRight, desc: "나른한 3시, 집중력이 필요할 때" },
    { id: "비 오는 날", label: "비 오는 날", icon: CloudRain, desc: "차분하게 내리는 빗소리와 재즈 음악" },
    { id: "책 읽을 때", label: "책 읽을 때 / 명상", icon: BookOpen, desc: "사색에 잠기는 나만의 고요한 시간" },
    { id: "디저트와 함께", label: "디저트와 페어링", icon: Coffee, desc: "달콤한 디저트의 향미를 돋우는 밸런스" },
  ];

  const loadingMessages = [
    "바리스타가 선반 위에 놓인 원두 목록을 살피는 중입니다...",
    "원두들의 로스팅 날짜와 개봉 기간을 대조하고 있습니다...",
    "오늘 사용자의 상황에 가장 완벽한 추출 온도와 물 비율을 계산하는 중입니다...",
    "가장 화사한 향미를 이끌어낼 브루잉 레시피를 정밀 조정하는 중입니다...",
    "원두들의 맛 특징을 담은 감성적인 맞춤 노트를 작성 중입니다..."
  ];

  const fetchActiveShelf = async () => {
    try {
      const response = await fetch("/api/v1/shelf?include_finished=false");
      const data = await response.json();
      if (data.data) {
        setShelfItems(data.data);
      }
    } catch (error) {
      console.error("Error fetching shelf for AI:", error);
    }
  };

  useEffect(() => {
    fetchActiveShelf();
  }, [refreshTrigger]);

  // Loading message rotator
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isLoading) {
      interval = setInterval(() => {
        setLoadingStep((prev) => (prev + 1) % loadingMessages.length);
      }, 3000);
    }
    return () => clearInterval(interval);
  }, [isLoading]);

  const handleGetRecommendation = async () => {
    try {
      setIsLoading(true);
      setLoadingStep(0);
      setRecommendation("");
      setWarningMsg("");

      const response = await fetch("/api/v1/ai-barista", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ situation }),
      });

      const data = await response.json();
      if (data.recommendation) {
        setRecommendation(data.recommendation);
        if (data.warning) {
          setWarningMsg(data.warning);
        }
      } else {
        throw new Error(data.error?.message || "추천을 생성하지 못했습니다.");
      }
    } catch (error: any) {
      console.error("Error generating AI recommendation:", error);
      alert(error.message || "AI 추천 호출 중 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  // Safe manual markdown renderer to avoid react-markdown npm install issues
  const renderMarkdown = (text: string) => {
    if (!text) return null;

    const lines = text.split("\n");
    return lines.map((line, idx) => {
      // 1. Check for Headings
      if (line.startsWith("### ")) {
        return (
          <motion.h4
            key={idx}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: idx * 0.03, ease: "easeOut" }}
            className="font-serif font-bold text-espresso text-sm mt-5 mb-2 flex items-center gap-1.5 border-l-2 border-caramel pl-2"
          >
            {line.replace("### ", "")}
          </motion.h4>
        );
      }
      if (line.startsWith("## ")) {
        return (
          <motion.h3
            key={idx}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: idx * 0.03, ease: "easeOut" }}
            className="font-serif font-extrabold text-espresso text-base mt-6 mb-3 border-b border-sand pb-1"
          >
            {line.replace("## ", "")}
          </motion.h3>
        );
      }

      // 2. Check for Bullet list items
      if (line.startsWith("- ") || line.startsWith("* ")) {
        const content = line.replace(/^[-*]\s+/, "");
        return (
          <motion.li
            key={idx}
            initial={{ opacity: 0, x: -5 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: idx * 0.03, ease: "easeOut" }}
            className="text-xs text-cocoa leading-relaxed ml-4 list-disc mb-1 font-medium"
          >
            {parseBoldText(content)}
          </motion.li>
        );
      }

      // 3. Check for Blockquotes or barista comments
      if (line.startsWith("> ")) {
        return (
          <motion.div
            key={idx}
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: idx * 0.03, ease: "easeOut" }}
            className="my-4 p-4 bg-[#f7f7f4] border-l-4 border-caramel/40 rounded-r-xl italic text-xs text-espresso/90 flex gap-2"
          >
            <Quote size={14} className="text-caramel/50 shrink-0" />
            <p className="leading-relaxed">{parseBoldText(line.replace("> ", ""))}</p>
          </motion.div>
        );
      }

      // 4. Handle empty line
      if (line.trim() === "") {
        return <div key={idx} className="h-2" />;
      }

      // 5. Normal paragraph
      return (
        <motion.p
          key={idx}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: idx * 0.03, ease: "easeOut" }}
          className="text-xs text-cocoa leading-relaxed mb-2 font-medium"
        >
          {parseBoldText(line)}
        </motion.p>
      );
    });
  };

  // Helper to parse double asterisks **bold** in text
  const parseBoldText = (text: string) => {
    const parts = text.split(/\*\*([^*]+)\*\*/g);
    return parts.map((part, index) => {
      // Every odd element was inside **
      if (index % 2 === 1) {
        return <strong key={index} className="font-extrabold text-espresso">{part}</strong>;
      }
      return part;
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-sand pb-4">
        <h2 className="text-xl font-bold font-serif text-espresso flex items-center gap-2">
          <Sparkles className="text-caramel animate-pulse" size={20} />
          AI 바리스타 추천 (AI Barista Engine)
        </h2>
        <p className="text-xs text-cocoa mt-1">
          현재 원두 보관함(Coffee Shelf)에 남아 있는 원두 정보와 귀하의 취향 태그를 종합 분석하여 최적의 핸드드립 레시피와 스페셜 블렌딩 컵을 디자인해 드립니다.
        </p>
      </div>

      {/* Grid selector for situations */}
      <div className="space-y-3">
        <label className="text-xs font-bold text-espresso">오늘 커피를 내리는 순간은 언제인가요?</label>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          {situations.map((sit) => {
            const Icon = sit.icon;
            const isSelected = situation === sit.id;
            return (
              <motion.button
                key={sit.id}
                whileHover={{ scale: 1.04, y: -2 }}
                whileTap={{ scale: 0.96 }}
                onClick={() => setSituation(sit.id)}
                className={cn(
                  "flex flex-col items-center justify-center p-3.5 rounded-xl border text-center transition-all duration-200 cursor-pointer h-24 border-none",
                  isSelected
                    ? "bg-espresso border-espresso text-white shadow-md"
                    : "bg-white border-sand text-cocoa hover:border-caramel hover:bg-canvas/35"
                )}
              >
                <Icon size={18} className={cn("mb-2", isSelected ? "text-caramel" : "text-cocoa/70")} />
                <span className="text-[11px] font-bold tracking-tight">{sit.label}</span>
                <span className={cn("text-[9px] mt-1 line-clamp-1 opacity-70 scale-90", isSelected ? "text-cream" : "text-cocoa/50")}>
                  {sit.desc.split(",")[0]}
                </span>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Active Beans Preview Alert */}
      <div className="bg-canvas/50 p-4 border border-sand rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3.5">
        <div className="space-y-1">
          <h4 className="text-[10px] uppercase font-bold text-caramel tracking-wider flex items-center gap-1.5">
            <Coffee size={12} />
            선반의 활성 원두 상황
          </h4>
          {shelfItems.length > 0 ? (
            <p className="text-xs text-espresso font-semibold">
              현재 보관함에 <span className="text-caramel font-extrabold">{shelfItems.length}종</span>의 원두가 대기 중입니다.
            </p>
          ) : (
            <p className="text-xs text-cinnamon font-bold flex items-center gap-1">
              <AlertCircle size={12} />
              보관 중인 활성 원두가 없습니다. AI 추천 진행 시 샘플 원두가 사용됩니다.
            </p>
          )}
        </div>

        <Button
          onClick={handleGetRecommendation}
          disabled={isLoading}
          className="bg-espresso hover:bg-caramel text-white rounded-xl text-xs font-bold px-6 py-2 h-10 shadow-sm cursor-pointer shrink-0"
        >
          {isLoading ? (
            <>
              <Loader2 className="animate-spin mr-1.5" size={14} />
              바리스타 추천 추출 중...
            </>
          ) : (
            <>
              바리스타 맞춤 가이드 요청
              <Sparkles size={13} className="ml-1.5" />
            </>
          )}
        </Button>
      </div>

      {/* Loading state rendering */}
      {isLoading && (
        <div className="bg-white border border-sand rounded-3xl p-16 flex flex-col items-center justify-center text-center space-y-4 shadow-sm min-h-[300px]">
          <div className="relative">
            <div className="w-16 h-16 rounded-full border-4 border-sand border-t-caramel animate-spin" />
            <div className="absolute inset-0 flex items-center justify-center text-caramel">
              <Coffee size={20} className="animate-pulse" />
            </div>
          </div>
          <div className="space-y-2 max-w-sm">
            <p className="text-xs font-extrabold text-espresso tracking-tight">AI 바리스타 가이드 추출 중</p>
            <p className="text-[11px] text-cocoa leading-relaxed font-semibold transition-all duration-500 animate-pulse">
              {loadingMessages[loadingStep]}
            </p>
          </div>
        </div>
      )}

      {/* Recommendation Results */}
      {!isLoading && recommendation && (
        <div className="bg-white border border-sand rounded-3xl p-6 md:p-8 shadow-[0_6px_25px_rgba(44,29,17,0.03)] space-y-5 relative overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-300">
          
          {/* Subtle paper layout glow */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-caramel/5 rounded-full blur-3xl pointer-events-none" />

          {/* Warning Flag */}
          {warningMsg && (
            <div className="bg-sand/10 border border-sand text-cocoa px-3.5 py-2 rounded-xl text-[10px] flex items-center gap-1.5 font-semibold">
              <AlertCircle size={13} className="text-caramel/80" />
              <span>{warningMsg}</span>
            </div>
          )}

          {/* Recommendations Render Area */}
          <div className="prose prose-sm max-w-none text-left">
            {renderMarkdown(recommendation)}
          </div>

          {/* Footer ritual badge */}
          <div className="border-t border-sand/50 pt-4 flex justify-between items-center text-[10px] text-cocoa font-bold">
            <span className="flex items-center gap-1">
              ☕ Hyangmi AI Sommelier System
            </span>
            <span>
              기분: {situation}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
