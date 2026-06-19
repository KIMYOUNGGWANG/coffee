"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Sparkles, Thermometer, Scale, Clock, Droplet } from "lucide-react";
import { TastingCardData } from "@/hooks/useTastingCards";

interface AIBrewingGuideProps {
  card: TastingCardData;
}

export default function AIBrewingGuide({ card }: AIBrewingGuideProps) {
  const [isRevealed, setIsRevealed] = useState(false);

  // Mock recipe logic based on radar metrics
  const isHighAcidity = card.metric1 >= 4;
  const isHighBody = card.metric3 >= 4;

  const recipe = {
    temp: isHighAcidity ? "90°C - 92°C" : "93°C - 95°C",
    grind: isHighBody ? "Medium Coarse" : "Medium Fine",
    ratio: isHighAcidity ? "1:15" : "1:16",
    time: isHighBody ? "2:30 - 3:00" : "2:00 - 2:30",
    tip: isHighAcidity
      ? "풍부한 산미를 끌어올리기 위해 추출 온도를 낮추고 물 빠짐을 빠르게 가져가 보세요."
      : isHighBody
      ? "묵직한 바디감을 살리기 위해 굵은 분쇄도와 천천히 떨어지는 추출이 어울립니다."
      : "밸런스가 좋은 커피입니다. 표준적인 레시피(1:15 비율, 93°C)로 시작해 점차 취향에 맞게 조절해보세요.",
  };

  return (
    <div className="relative mt-6 rounded-2xl p-[1px] overflow-hidden group cursor-pointer" onClick={() => setIsRevealed(!isRevealed)}>
      {/* Animated Glowing Border */}
      <span className="absolute inset-[-1000%] animate-[spin_4s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#0D0A07_0%,#d9a05b_50%,#0D0A07_100%)] opacity-30 group-hover:opacity-100 transition-opacity duration-500" />

      <div className="relative bg-[#0D0A07] backdrop-blur-xl border border-white/10 p-5 rounded-2xl h-full w-full z-10 transition-all">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-primary-amber/20 flex items-center justify-center">
              <Sparkles size={12} className="text-primary-amber animate-pulse" />
            </div>
            <h4 className="font-serif font-bold text-sm text-foreground">AI 맞춤 브루잉 가이드</h4>
          </div>
          <span className="text-[10px] text-muted-foreground bg-white/5 px-2 py-1 rounded-full border border-white/5 group-hover:bg-primary-amber/10 group-hover:text-primary-amber transition-colors">
            {isRevealed ? "숨기기" : "레시피 보기"}
          </span>
        </div>

        <AnimatePresence>
          {isRevealed && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.4, ease: "easeInOut" }}
              className="overflow-hidden"
            >
              <div className="pt-5 space-y-4">
                <p className="text-xs text-foreground/90 leading-relaxed italic border-l-2 border-primary-amber/50 pl-3">
                  "{recipe.tip}"
                </p>

                <div className="grid grid-cols-2 gap-3 pt-2">
                  <motion.div
                    initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }}
                    className="bg-white/5 border border-white/10 p-3 rounded-xl flex items-center gap-3"
                  >
                    <Thermometer size={14} className="text-primary-amber" />
                    <div>
                      <p className="text-[9px] text-muted-foreground font-bold uppercase tracking-widest">온도</p>
                      <p className="text-xs font-semibold text-foreground mt-0.5">{recipe.temp}</p>
                    </div>
                  </motion.div>

                  <motion.div
                    initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }}
                    className="bg-white/5 border border-white/10 p-3 rounded-xl flex items-center gap-3"
                  >
                    <Scale size={14} className="text-primary-amber" />
                    <div>
                      <p className="text-[9px] text-muted-foreground font-bold uppercase tracking-widest">분쇄도</p>
                      <p className="text-xs font-semibold text-foreground mt-0.5">{recipe.grind}</p>
                    </div>
                  </motion.div>

                  <motion.div
                    initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }}
                    className="bg-white/5 border border-white/10 p-3 rounded-xl flex items-center gap-3"
                  >
                    <Droplet size={14} className="text-primary-amber" />
                    <div>
                      <p className="text-[9px] text-muted-foreground font-bold uppercase tracking-widest">비율</p>
                      <p className="text-xs font-semibold text-foreground mt-0.5">{recipe.ratio}</p>
                    </div>
                  </motion.div>

                  <motion.div
                    initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.4 }}
                    className="bg-white/5 border border-white/10 p-3 rounded-xl flex items-center gap-3"
                  >
                    <Clock size={14} className="text-primary-amber" />
                    <div>
                      <p className="text-[9px] text-muted-foreground font-bold uppercase tracking-widest">시간</p>
                      <p className="text-xs font-semibold text-foreground mt-0.5">{recipe.time}</p>
                    </div>
                  </motion.div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
