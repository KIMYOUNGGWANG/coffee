"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Archive, ExternalLink, Sparkles, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { evaluateFreshShelfStatus } from "@/lib/fresh-shelf";

// Exporting the type here so it can be used, or we could keep it in coffee-shelf-grid.
// We'll define it here for convenience.
export interface ShelfItem {
  id: string;
  roaster_name: string;
  bean_name: string;
  origin: string | null;
  roast_date: string | null;
  opened_date: string | null;
  total_weight: number;
  fill_level: number;
  is_finished: boolean;
  tasting_card_id: string | null;
  purchase_url: string | null;
  purchase_note: string | null;
}

interface CoffeePackageItemProps {
  item: ShelfItem;
  onUpdateFillLevel: (id: string, newLevel: number) => void;
  onToggleFinished: (id: string, isFinished: boolean) => void;
  onDelete: (id: string) => void;
}

const getFillLevelColor = (level: number) => {
  if (level > 50) return "bg-[#D4AF37]"; // Amber
  if (level > 20) return "bg-[#C58948]"; // Dark Amber
  return "bg-[#d9463e]"; // Crimson
};

const getRoastColorClasses = (roasterName: string, beanName: string, origin: string | null) => {
  const allText = `${roasterName} ${beanName} ${origin || ""}`.toLowerCase();
  if (allText.includes("light") || allText.includes("약배전") || allText.includes("에티오피아")) {
    return "bg-[#0A0D14] border-[#161D2A] text-white"; // Ultra dark blue
  }
  if (allText.includes("dark") || allText.includes("강배전") || allText.includes("인도네시아")) {
    return "bg-[#050505] border-[#111111] text-white"; // True black
  }
  return "bg-[#0D0905] border-[#1F150D] text-white"; // Ultra dark terracotta
};

function buildPurchaseUrl(item: ShelfItem): string {
  if (item.purchase_url) return item.purchase_url;
  return `https://www.google.com/search?q=${encodeURIComponent(`${item.roaster_name} ${item.bean_name} 원두 구매`)}`;
}

export function CoffeePackageItem({ item, onUpdateFillLevel, onToggleFinished, onDelete }: CoffeePackageItemProps) {
  const [isFlipped, setIsFlipped] = useState(false);

  const freshShelfStatus = evaluateFreshShelfStatus({
    roastDate: item.roast_date,
    openedDate: item.opened_date,
    fillLevel: item.fill_level,
    isFinished: item.is_finished,
  });

  const packageColors = getRoastColorClasses(item.roaster_name, item.bean_name, item.origin);

  return (
    <div className="coffee-shelf-item group cursor-pointer perspective-1000">
      <motion.div
        className="w-full relative preserve-3d"
        style={{ aspectRatio: "3/4" }}
        animate={{ rotateY: isFlipped ? 180 : 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        onClick={() => setIsFlipped(!isFlipped)}
      >
        {/* Front of the Bag */}
        <div
          className={cn(
            "absolute inset-0 backface-hidden rounded-md shadow-[0_30px_60px_rgba(0,0,0,0.8)] flex flex-col justify-end p-5 border text-left",
            isFlipped ? "pointer-events-none" : "pointer-events-auto",
            packageColors,
          )}
          aria-hidden={isFlipped}
        >
          {/* Noise overlay for premium paper/bag texture */}
          <div className="absolute inset-0 opacity-10 mix-blend-overlay pointer-events-none rounded-md" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.85%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E")' }}></div>
          
          {/* Faux seal at the top */}
          <div className="absolute top-0 left-0 right-0 h-4 bg-white/5 border-b border-white/5 flex items-center justify-center rounded-t-md shadow-inner">
            <div className="w-16 h-0.5 rounded-full bg-white/10"></div>
          </div>
          
          <div className="z-10 w-full mb-3">
            <p className="text-[10px] uppercase tracking-[0.2em] text-[#D4AF37] font-light mb-3 line-clamp-1">{item.roaster_name}</p>
            <h3 className="font-serif font-light text-2xl text-white leading-tight mb-1.5 break-keep">{item.bean_name}</h3>
            {item.origin && (
              <p className="text-xs text-white/50 font-light tracking-widest line-clamp-1">{item.origin}</p>
            )}
          </div>
          
          {/* Fill Level Indicator Bar on Front (Integrated cleanly at the bottom) */}
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/50 overflow-hidden rounded-b-md">
             <div className={cn("h-full transition-all duration-700 ease-out", getFillLevelColor(item.fill_level))} style={{ width: `${item.fill_level}%` }} />
          </div>
        </div>

        {/* Back of the Bag (Details & Controls) */}
        <div 
          className={cn(
            "absolute inset-0 backface-hidden rounded-md shadow-[0_30px_60px_rgba(0,0,0,0.8)] p-5 flex flex-col bg-black/80 backdrop-blur-2xl border border-white/10",
            isFlipped ? "pointer-events-auto" : "pointer-events-none",
          )}
          aria-hidden={!isFlipped}
          style={{ transform: "rotateY(180deg)" }}
          onClick={(e) => e.stopPropagation()} // Prevent flip when interacting with controls
        >
           <div className="flex justify-between items-start mb-4 border-b border-white/5 pb-3">
              <span className="text-[10px] tracking-widest uppercase font-light text-[#D4AF37] pt-1">Details</span>
              <button onClick={() => setIsFlipped(false)} className="text-[10px] text-white/50 hover:text-white transition-colors cursor-pointer bg-transparent border-none p-2 -mt-1 -mr-2 min-w-[44px] min-h-[44px] flex items-start justify-end">닫기</button>
           </div>
           
           <div className="space-y-4 flex-1 overflow-y-auto pr-1">
             <div className="grid grid-cols-1 gap-2 text-[10px] text-white/80 font-light">
                <div className="flex justify-between items-center min-h-[24px]">
                  <span className="text-white/50">로스팅 일자</span>
                  <span>{item.roast_date || "미기재"}</span>
                </div>
                <div className="flex justify-between items-center min-h-[24px]">
                  <span className="text-white/50">개봉 일자</span>
                  <span>{item.opened_date || "미기재"}</span>
                </div>
             </div>

             <div className="text-[10px] bg-white/[0.03] rounded-md p-3 border border-white/5">
                <div className="flex items-center gap-1.5 font-bold text-white mb-1.5">
                  <Sparkles size={12} className="text-[#D4AF37]" />
                  {freshShelfStatus.label}
                </div>
                <p className="text-white/60 leading-relaxed font-light">{freshShelfStatus.reason}</p>
             </div>

             <a
                href={buildPurchaseUrl(item)}
                target="_blank"
                rel="noreferrer"
                className="flex min-h-[44px] items-center justify-between gap-3 rounded-md border border-[#D4AF37]/20 bg-[#D4AF37]/5 px-3 py-3 text-[10px] font-light text-[#D4AF37] transition-colors hover:bg-[#D4AF37]/15"
                onClick={(event) => event.stopPropagation()}
             >
                <span className="min-w-0">
                  <span className="block font-bold">다시 찾기</span>
                  <span className="block truncate text-white/50">{item.purchase_note ?? "저장된 단서로 재구매 검색을 엽니다."}</span>
                </span>
                <ExternalLink size={12} className="shrink-0" />
             </a>

             <div className="space-y-2">
                <div className="flex justify-between items-center text-[10px] min-h-[24px]">
                  <span className="text-white/50 font-light">남은 잔량</span>
                  <span className="font-light text-white">{item.fill_level}% ({item.total_weight}g)</span>
                </div>
                <div className="flex gap-1 mt-1">
                  {[100, 75, 50, 25].map(level => (
                    <button
                      key={level}
                      onClick={() => onUpdateFillLevel(item.id, level)}
                      className={cn(
                        "flex-1 text-[10px] py-3 rounded border transition-colors cursor-pointer min-h-[44px] flex items-center justify-center",
                        item.fill_level === level ? "bg-[#D4AF37]/20 border-[#D4AF37]/50 text-[#D4AF37] font-bold" : "bg-white/5 border-white/5 text-white/50 hover:bg-white/10 hover:text-white"
                      )}
                    >
                      {level}
                    </button>
                  ))}
                </div>
             </div>
           </div>

           <div className="flex gap-2 pt-4 border-t border-white/5 mt-3">
              <button
                onClick={() => onToggleFinished(item.id, true)}
                className="flex-1 flex items-center justify-center gap-1.5 bg-[#D4AF37]/5 hover:bg-[#D4AF37]/15 text-[#D4AF37] text-[10px] font-light py-3 rounded-md transition-colors cursor-pointer border border-[#D4AF37]/20 min-h-[44px]"
              >
                <Archive size={12} /> 다 마심
              </button>
              <button
                onClick={() => onDelete(item.id)}
                className="flex-1 flex items-center justify-center gap-1.5 bg-red-500/5 hover:bg-red-500/15 text-red-400 text-[10px] font-light py-3 rounded-md transition-colors cursor-pointer border border-red-500/20 min-h-[44px]"
              >
                <Trash2 size={12} /> 삭제
              </button>
           </div>
        </div>
      </motion.div>

      {/* Package Shadow to create shelf depth */}
      <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-[85%] h-6 bg-black blur-xl rounded-full -z-10 pointer-events-none opacity-80" />
    </div>
  );
}
