"use client";

import React, { useState } from "react";
import { X, Calendar, Plus, Clock, Scale, Thermometer, Star, Sparkles, Droplet, Edit2, Trash2, Check, Coffee, Heart } from "lucide-react";
import { TastingCardData, useBrewingNotes, useUpdateBrewingNote, useDeleteBrewingNote } from "@/hooks/useTastingCards";
import { Button } from "./ui/button";
import { FlavorRadarChart } from "./flavor-radar-chart";
import AIBrewingGuide from "./AIBrewingGuide";
import { useQueryClient } from "@tanstack/react-query";
import { hasBrewRecallMetadata } from "@/lib/brew-recall";

interface CardDetailModalProps {
  card: TastingCardData;
  isOpen: boolean;
  onClose: () => void;
}

export default function CardDetailModal({ card, isOpen, onClose }: CardDetailModalProps) {
  const queryClient = useQueryClient();
  const { data: notes, isLoading } = useBrewingNotes(card.id);
  const updateNoteMutation = useUpdateBrewingNote(card.id);
  const deleteNoteMutation = useDeleteBrewingNote(card.id);

  // Form states for a new brewing log
  const [isFormOpen, setIsFormOpen] = useState(false);

  // AI Barista Feedback states
  const [feedbackAdvice, setFeedbackAdvice] = useState<string | null>(null);
  const [isLoadingFeedback, setIsLoadingFeedback] = useState(false);
  const [activeFeedback, setActiveFeedback] = useState<"too_sour" | "too_bitter" | "too_watery" | "perfect" | null>(null);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [isSavingLog, setIsSavingLog] = useState(false);
  const [isSavingGhost, setIsSavingGhost] = useState(false);
  const [lastRecipe, setLastRecipe] = useState<{
    waterTemp: number;
    grindSize: string;
    brewTime: string;
    coffeeAmount: number;
    waterAmount: number;
  } | null>(null);

  const handleFeedbackClick = async (feedbackType: "too_sour" | "too_bitter" | "too_watery" | "perfect") => {
    setIsLoadingFeedback(true);
    setActiveFeedback(feedbackType);
    setFeedbackAdvice(null);
    setSavedSuccess(false);
    
    try {
      const response = await fetch("/api/v1/ai-barista", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          beanId: card.id,
          feedback: feedbackType,
        }),
      });
      
      const data = await response.json();
      
      if (response.ok && data.recommendation) {
        setFeedbackAdvice(data.recommendation);
        
        let targetTemp = 92;
        let targetGrind = "Medium";
        let targetTime = "150";
        let targetCoffee = 15;
        let targetWater = 225;
        
        if (feedbackType === "too_sour") {
          targetTemp = 94;
          targetGrind = "Medium Fine";
          targetTime = "165";
        } else if (feedbackType === "too_bitter") {
          targetTemp = 90;
          targetGrind = "Medium Coarse";
          targetTime = "135";
        } else if (feedbackType === "too_watery") {
          targetTemp = 92;
          targetGrind = "Medium Fine";
          targetTime = "150";
          targetCoffee = 16;
        } else if (feedbackType === "perfect") {
          targetTemp = 92;
          targetGrind = "Medium";
          targetTime = "150";
        }
        
        setLastRecipe({
          waterTemp: targetTemp,
          grindSize: targetGrind,
          brewTime: targetTime,
          coffeeAmount: targetCoffee,
          waterAmount: targetWater,
        });
      } else {
        alert(data.error?.message || "처방전을 가져오는데 실패했습니다.");
      }
    } catch (err) {
      console.error("Failed to fetch feedback advice:", err);
      alert("브루잉 조정값을 가져오는 중 오류가 발생했습니다.");
    } finally {
      setIsLoadingFeedback(false);
    }
  };

  const handleSaveRecipeLog = async () => {
    if (!lastRecipe || !activeFeedback) return;
    setIsSavingLog(true);
    
    try {
      // Find matching shelf item id
      const shelfRes = await fetch("/api/v1/shelf");
      const shelfJson = await shelfRes.json();
      let shelfItemId: string | null = null;
      
      if (shelfRes.ok && shelfJson.data) {
        const matchedItem = shelfJson.data.find(
          (item: any) => item.tasting_card_id === card.id || item.tastingCardId === card.id
        );
        if (matchedItem) {
          shelfItemId = matchedItem.id;
        }
      }
      
      const payload = {
        shelfItemId: shelfItemId || null,
        method: "Hario V60",
        parameters: {
          waterTemp: lastRecipe.waterTemp,
          waterAmount: lastRecipe.waterAmount,
          coffeeAmount: lastRecipe.coffeeAmount,
          grindSize: lastRecipe.grindSize,
          brewTime: lastRecipe.brewTime,
        },
        rating: activeFeedback === "perfect" ? 5 : 3,
        simpleNote: `브루잉 조정값 적용: ${activeFeedback}.`,
      };
      
      const response = await fetch("/api/v1/brewing-logs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
      
      const data = await response.json();
      if (response.ok) {
        setSavedSuccess(true);
        // Invalidate queries to refresh layout
        queryClient.invalidateQueries({ queryKey: ["brewing-notes", card.id] });
        queryClient.invalidateQueries({ queryKey: ["tasting-cards"] });
        queryClient.invalidateQueries({ queryKey: ["tasting-cards", card.id] });
        queryClient.invalidateQueries({ queryKey: ["taste-analytics"] });
      } else {
        alert(data.error?.message || "보정 레시피 저장에 실패했습니다.");
      }
    } catch (err) {
      console.error("Failed to save brewing log:", err);
      alert("추출 로그 저장 중 오류가 발생했습니다.");
    } finally {
      setIsSavingLog(false);
    }
  };

  const handleSaveGhostLog = async () => {
    setIsSavingGhost(true);
    try {
      // 1. Fetch ghost recipe
      const ghostRes = await fetch(`/api/v1/brewing-logs/ghost?cardId=${card.id}`);
      const ghostData = await ghostRes.json();
      
      if (!ghostRes.ok || !ghostData.data) {
        alert(ghostData.error?.message || "고스트 레시피를 가져오는데 실패했습니다.");
        return;
      }

      const { method, parameters, rating, simpleNote } = ghostData.data;

      // 2. Find matching shelf item id
      const shelfRes = await fetch("/api/v1/shelf");
      const shelfJson = await shelfRes.json();
      let shelfItemId: string | null = null;
      
      if (shelfRes.ok && shelfJson.data) {
        const matchedItem = shelfJson.data.find(
          (item: any) => item.tasting_card_id === card.id || item.tastingCardId === card.id
        );
        if (matchedItem) {
          shelfItemId = matchedItem.id;
        }
      }
      
      // 3. Save brewing log
      const response = await fetch("/api/v1/brewing-logs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          shelfItemId: shelfItemId || null,
          method: method || "Hario V60",
          parameters: parameters,
          rating: rating || 5,
          simpleNote: simpleNote || "취향 쌍둥이의 레시피로 추출함",
          autoRecipe: true
        }),
      });
      
      if (response.ok) {
        queryClient.invalidateQueries({ queryKey: ["brewing-notes", card.id] });
        queryClient.invalidateQueries({ queryKey: ["tasting-cards"] });
        queryClient.invalidateQueries({ queryKey: ["taste-analytics"] });
        setIsFormOpen(false);
      } else {
        const errorData = await response.json();
        alert(errorData.error?.message || "고스트 레시피 기록 저장에 실패했습니다.");
      }
    } catch (err) {
      console.error("Failed to save ghost log:", err);
      alert("추출 로그 저장 중 오류가 발생했습니다.");
    } finally {
      setIsSavingGhost(false);
    }
  };

  const parseBoldText = (text: string) => {
    const parts = text.split(/\*\*([^*]+)\*\*/g);
    return parts.map((part, index) => {
      if (index % 2 === 1) {
        return <strong key={index} className="font-extrabold text-foreground">{part}</strong>;
      }
      return part;
    });
  };

  const renderMarkdown = (text: string) => {
    if (!text) return null;
    return text.split("\n").map((line, idx) => {
      if (line.startsWith("### ")) {
        return <h3 key={idx} className="text-sm font-bold text-foreground mt-4 mb-2">{line.replace("### ", "")}</h3>;
      }
      if (line.startsWith("#### ")) {
        return <h4 key={idx} className="text-xs font-bold text-foreground mt-3 mb-1.5">{line.replace("#### ", "")}</h4>;
      }
      if (line.trim().startsWith("* ") || line.trim().startsWith("- ")) {
        const cleanLine = line.replace(/^\s*[-*]\s+/, "");
        return (
          <li key={idx} className="text-xs text-muted-foreground leading-relaxed list-none pl-3 border-l border-primary-amber/30 my-1">
            {parseBoldText(cleanLine)}
          </li>
        );
      }
      if (line.startsWith("> ")) {
        return (
          <div key={idx} className="my-3 p-3 bg-white/5 border-l-2 border-primary-amber/40 rounded-r-lg italic text-[11px] text-foreground/90">
            <p className="leading-relaxed">{parseBoldText(line.replace("> ", ""))}</p>
          </div>
        );
      }
      if (line.trim() === "") {
        return <div key={idx} className="h-1.5" />;
      }
      return (
        <p key={idx} className="text-xs text-muted-foreground leading-relaxed mb-1.5 font-medium">
          {parseBoldText(line)}
        </p>
      );
    });
  };

  // Form states for editing an existing brewing log
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editMethod, setEditMethod] = useState("Hario V60");
  const [editBeanAmount, setEditBeanAmount] = useState<number>(15);
  const [editWaterAmount, setEditWaterAmount] = useState<number>(225);
  const [editGrindSize, setEditGrindSize] = useState("");
  const [editWaterTemp, setEditWaterTemp] = useState<number>(92);
  const [editBrewTime, setEditBrewTime] = useState<number>(150); // in seconds
  const [editRating, setEditRating] = useState<number>(3);
  const [editMemo, setEditMemo] = useState("");

  if (!isOpen) return null;

  const privateRebuyReason = card.repurchase_intent === "again"
    ? card.repurchase_reasons.find((reason) => reason.trim().length > 0)?.trim()
    : undefined;
  const footerExtraInfo = card.footer_meta.extraInfo?.trim();
  const lastGoodBrewSummary = hasBrewRecallMetadata(footerExtraInfo) ? footerExtraInfo : undefined;

  const handleEditStart = (note: any) => {
    setEditingNoteId(note.id);
    setEditMethod(note.method);
    setEditBeanAmount(note.bean_amount);
    setEditWaterAmount(note.water_amount);
    setEditGrindSize(note.grind_size || "");
    setEditWaterTemp(note.water_temp || 92);
    setEditBrewTime(note.brew_time || 150);
    setEditRating(note.rating || 3);
    setEditMemo(note.memo || "");
  };

  const handleUpdateNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingNoteId) return;
    try {
      await updateNoteMutation.mutateAsync({
        id: editingNoteId,
        fields: {
          method: editMethod,
          beanAmount: editBeanAmount,
          waterAmount: editWaterAmount,
          grindSize: editGrindSize || null,
          waterTemp: editWaterTemp,
          brewTime: editBrewTime,
          rating: editRating,
          memo: editMemo || null,
        },
      });
      setEditingNoteId(null);
    } catch (err) {
      console.error("Failed to update brewing note:", err);
      alert("추출 노트를 수정하는 데 실패했습니다.");
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    if (!confirm("이 추출 기록을 정말 삭제하시겠습니까?")) return;
    try {
      await deleteNoteMutation.mutateAsync(noteId);
    } catch (err) {
      console.error("Failed to delete brewing note:", err);
      alert("추출 노트를 삭제하는 데 실패했습니다.");
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-40 flex items-center justify-center p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`${card.title} 상세 기록`}
        className="glass-card border border-white/10 rounded-3xl w-full max-w-4xl shadow-2xl h-[90vh] flex flex-col md:flex-row overflow-hidden animate-in fade-in zoom-in-95 duration-200"
      >

        {/* Left Pane: Tasting Card Display (Physical Passport Style) */}
        <div className="w-full md:w-5/12 bg-black/40 p-6 md:p-8 flex flex-col justify-between border-b md:border-b-0 md:border-r border-white/10 overflow-y-auto relative z-10">
          <div>
            <div className="flex justify-between items-center pb-3 border-b border-primary-amber/20">
              <span className="text-[10px] uppercase tracking-wider font-extrabold text-primary-amber">CoffeeDex Taste Passport</span>
              <button
                onClick={onClose}
                className="md:hidden p-1.5 rounded-full hover:bg-white/10 text-muted-foreground"
              >
                <X size={16} />
              </button>
            </div>

            {/* Coffee details info */}
            <div className="mt-6 space-y-4">
              <div className="flex gap-2 items-center">
                <span className="text-[10px] uppercase font-extrabold text-foreground tracking-wider bg-white/10 px-2.5 py-1 rounded-full shadow-sm">
                  {card.badges?.[0] || "Single Origin"}
                </span>
                <span className="text-[10px] font-extrabold text-[#0D0A07] tracking-wider bg-primary-amber px-2.5 py-1 rounded-full shadow-sm flex items-center gap-1">
                  ✨ 취향 일치도 87%
                </span>
              </div>
              <h2 className="font-serif text-3xl font-extrabold leading-tight text-foreground">{card.title}</h2>
              <p className="text-sm font-semibold text-muted-foreground">{card.subtitle}</p>

              {(privateRebuyReason || lastGoodBrewSummary) && (
                <div className="space-y-2 pt-1 text-xs">
                  {privateRebuyReason && (
                    <div className="min-w-0 border-l border-primary-amber/50 pl-3">
                      <p className="text-[10px] font-bold tracking-wider text-primary-amber">다시 살 이유</p>
                      <p className="mt-0.5 truncate text-foreground/85">{privateRebuyReason}</p>
                    </div>
                  )}
                  {lastGoodBrewSummary && (
                    <div className="min-w-0 border-l border-white/20 pl-3">
                      <p className="text-[10px] font-bold tracking-wider text-primary-amber">마지막 좋았던 추출</p>
                      <p className="mt-0.5 truncate text-foreground/85">{lastGoodBrewSummary}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Image if available */}
              {card.image_url && (
                <div className="w-full aspect-[4/3] rounded-2xl overflow-hidden border border-white/10 bg-white/5 shadow-inner">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={card.image_url} alt={card.title} className="w-full h-full object-cover" />
                </div>
              )}

              {/* Taste profile Radar Chart */}
              <div className="py-4 flex justify-center w-full">
                <FlavorRadarChart
                  metric1={card.metric1}
                  metric2={card.metric2}
                  metric3={card.metric3}
                  metric4={card.metric4 ?? 3}
                  metric5={card.metric5 ?? 3}
                  metric6={card.metric6 ?? 3}
                  className="w-[240px] h-[240px]"
                />
              </div>

              {/* Flavor Tags */}
              <div className="flex flex-wrap gap-1.5 pt-2">
                {card.tags.map((tag, i) => (
                  <span key={i} className="text-xs px-2.5 py-1 bg-white/5 border border-white/10 rounded-full text-foreground/80 font-bold shadow-sm">
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* AI Narrative Quote block */}
          <div className="mt-8 bg-white/5 border border-primary-amber/30 p-5 rounded-2xl relative shadow-sm">
            <span className="absolute -top-3 left-4 bg-black px-2 text-[9px] uppercase font-bold text-primary-amber tracking-wider border border-primary-amber/30 rounded-full flex items-center gap-1">
              <Sparkles size={9} />
              Flavor Note
            </span>
            <p className="font-serif text-xs italic text-foreground/90 leading-relaxed pt-1.5 font-medium">
              “{card.ai_description || "느껴지는 아로마 노트를 기록하고 향미 한줄평 초안을 만들어보세요."}”
            </p>
          </div>

          <AIBrewingGuide card={card} />

          {/* AI Barista Feedback Loop */}
          <div className="mt-6 border border-white/10 bg-white/5 p-5 rounded-2xl relative shadow-sm space-y-4">
            <span className="absolute -top-3 left-4 bg-black px-2.5 py-0.5 text-[9px] uppercase font-bold text-primary-amber tracking-wider border border-white/10 rounded-full flex items-center gap-1">
              <Sparkles size={9} />
              Brew Tuning
            </span>
            
            <div className="pt-1">
              <h4 className="text-xs font-bold text-foreground">이 원두의 추출 맛은 어떤가요?</h4>
              <p className="text-[10px] text-muted-foreground mt-0.5">내 피드백에 맞춰 다음 레시피의 변수를 조정합니다.</p>
            </div>
            
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleFeedbackClick("too_sour")}
                disabled={isLoadingFeedback}
                className={`py-2 px-3 text-[10px] font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all border outline-none cursor-pointer ${
                  activeFeedback === "too_sour" 
                    ? "bg-primary-amber/20 border-primary-amber/50 text-primary-amber" 
                    : "bg-white/5 border-white/10 text-muted-foreground hover:bg-white/10 hover:text-foreground"
                }`}
              >
                <Droplet size={13} aria-hidden="true" />
                <span>너무 신맛이 강함</span>
              </button>
              
              <button
                type="button"
                onClick={() => handleFeedbackClick("too_bitter")}
                disabled={isLoadingFeedback}
                className={`py-2 px-3 text-[10px] font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all border outline-none cursor-pointer ${
                  activeFeedback === "too_bitter" 
                    ? "bg-primary-amber/20 border-primary-amber/50 text-primary-amber" 
                    : "bg-white/5 border-white/10 text-muted-foreground hover:bg-white/10 hover:text-foreground"
                }`}
              >
                <Coffee size={13} aria-hidden="true" />
                <span>너무 쓰거나 떪</span>
              </button>
              
              <button
                type="button"
                onClick={() => handleFeedbackClick("too_watery")}
                disabled={isLoadingFeedback}
                className={`py-2 px-3 text-[10px] font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all border outline-none cursor-pointer ${
                  activeFeedback === "too_watery" 
                    ? "bg-primary-amber/20 border-primary-amber/50 text-primary-amber" 
                    : "bg-white/5 border-white/10 text-muted-foreground hover:bg-white/10 hover:text-foreground"
                }`}
              >
                <Droplet size={13} aria-hidden="true" />
                <span>싱겁고 연한 느낌</span>
              </button>
              
              <button
                type="button"
                onClick={() => handleFeedbackClick("perfect")}
                disabled={isLoadingFeedback}
                className={`py-2 px-3 text-[10px] font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all border outline-none cursor-pointer ${
                  activeFeedback === "perfect" 
                    ? "bg-primary-amber/20 border-primary-amber/50 text-primary-amber" 
                    : "bg-white/5 border-white/10 text-muted-foreground hover:bg-white/10 hover:text-foreground"
                }`}
              >
                <Heart size={13} aria-hidden="true" />
                <span>딱 맛있고 완벽함</span>
              </button>
            </div>
            
            {/* Advice Result block */}
            {(isLoadingFeedback || feedbackAdvice) && (
              <div className="mt-4 border border-white/10 bg-black/40 rounded-xl p-4 space-y-3 animate-in fade-in duration-200">
                {isLoadingFeedback ? (
                  <div className="flex flex-col items-center justify-center py-6 gap-2 text-muted-foreground">
                    <span className="text-[10px] animate-pulse font-semibold">다음 컵 조정값을 작성하고 있습니다...</span>
                  </div>
                ) : (
                  <>
                    <div className="prose prose-invert prose-xs text-left">
                      {renderMarkdown(feedbackAdvice || "")}
                    </div>
                    
                    <div className="border-t border-white/10 pt-3 flex justify-between items-center">
                      <span className="text-[9px] text-muted-foreground">보정수치: {lastRecipe?.waterTemp}°C | {lastRecipe?.grindSize}</span>
                      {savedSuccess ? (
                        <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
                          <Check size={12} />
                          일지 저장 완료
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={handleSaveRecipeLog}
                          disabled={isSavingLog}
                          className="px-3 py-1.5 bg-primary-amber hover:opacity-90 text-[#0D0A07] rounded-lg text-[10px] font-bold border-none cursor-pointer flex items-center gap-1"
                        >
                          {isSavingLog ? "저장 중..." : "📥 보정된 레시피 일지에 저장"}
                        </button>
                      )}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Pane: 1:N Brewing Notes List & Logger Form (Dark/Premium Style) */}
        <div className="flex-1 p-6 md:p-8 flex flex-col justify-between overflow-y-auto text-foreground">
          <div>
            <div className="flex justify-between items-center pb-4 border-b border-white/10">
              <div>
                <h3 className="font-serif font-bold text-lg text-foreground">추출 기록 (Brewing Notes)</h3>
                <p className="text-xs text-muted-foreground mt-0.5">원두를 소진하는 동안 기록한 다양한 추출법 히스토리입니다.</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsFormOpen(!isFormOpen)}
                  className="px-3 py-1.5 bg-primary-amber hover:opacity-90 text-[#0D0A07] rounded-xl text-xs font-bold flex items-center gap-1 shadow-sm transition-all border-none cursor-pointer"
                >
                  <Plus size={13} />
                  <span>새 기록 쓰기</span>
                </button>
                <button
                  onClick={onClose}
                  className="hidden md:block p-1.5 rounded-full hover:bg-white/10 text-muted-foreground transition-colors border-none bg-transparent cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Brewing Note Input Form - Replaced by 1-Click AI Auto Log */}
            {isFormOpen && (
              <>
                <div className="mt-4 p-5 border border-primary-amber/30 bg-primary-amber/5 rounded-2xl space-y-4 animate-in slide-in-from-top-4 duration-200">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-primary-amber/20 rounded-full text-primary-amber">
                    <Sparkles size={20} />
                  </div>
                  <div>
	                    <h4 className="text-sm font-bold text-foreground">추천 레시피로 기록</h4>
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
	                      복잡한 변수를 직접 입력할 필요 없이, 이 원두에 어울리는 추출 레시피를 기반으로 원클릭 기록을 남깁니다.
                    </p>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsFormOpen(false)}
                    className="px-3 py-2 bg-transparent border border-white/20 hover:bg-white/10 text-foreground rounded-xl text-xs font-bold cursor-pointer"
                  >
                    취소
                  </button>
                  <Button
                    onClick={async () => {
                      try {
                        const shelfRes = await fetch("/api/v1/shelf");
                        const shelfJson = await shelfRes.json();
                        let shelfItemId: string | null = null;
                        
                        if (shelfRes.ok && shelfJson.data) {
                          const matchedItem = shelfJson.data.find(
                            (item: any) => item.tasting_card_id === card.id || item.tastingCardId === card.id
                          );
                          if (matchedItem) {
                            shelfItemId = matchedItem.id;
                          }
                        }
                        
                        const response = await fetch("/api/v1/brewing-logs", {
                          method: "POST",
                          headers: {
                            "Content-Type": "application/json",
                          },
                          body: JSON.stringify({
                            shelfItemId: shelfItemId || null,
                            method: "Hario V60",
                            rating: 4,
	                            simpleNote: "추천 레시피로 추출함",
                            autoRecipe: true
                          }),
                        });
                        
                        if (response.ok) {
                          queryClient.invalidateQueries({ queryKey: ["brewing-notes", card.id] });
                          queryClient.invalidateQueries({ queryKey: ["tasting-cards"] });
                          queryClient.invalidateQueries({ queryKey: ["taste-analytics"] });
                          setIsFormOpen(false);
                        } else {
                          const errorData = await response.json();
                          alert(errorData.error?.message || "기록 저장에 실패했습니다.");
                        }
                      } catch (err) {
	                        console.error("Failed to save guided log:", err);
                        alert("추출 로그 저장 중 오류가 발생했습니다.");
                      }
                    }}
                    className="px-4 py-2 bg-primary-amber hover:opacity-90 text-[#0D0A07] rounded-xl text-xs font-bold border-none cursor-pointer flex items-center gap-1.5 shadow-md shadow-primary-amber/20"
                  >
                    <Sparkles size={14} />
	                    <span>추천 레시피로 원클릭 기록</span>
                  </Button>
                </div>
              </div>

              {/* Ghost Barista Section */}
              <div className="mt-4 p-5 border border-amber-500/40 bg-gradient-to-r from-black/80 to-[#1A140F] rounded-2xl space-y-4 animate-in slide-in-from-top-4 duration-300 shadow-lg shadow-amber-900/20">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-amber-500/20 rounded-full text-amber-400">
	                    <Sparkles size={18} aria-hidden="true" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-amber-400 flex items-center gap-2">
                      취향 쌍둥이의 레시피 발견
                      <span className="bg-amber-400/20 text-amber-300 px-2 py-0.5 rounded-full text-[10px] uppercase tracking-wider border border-amber-400/30">
                        싱크로율 96%
                      </span>
                    </h4>
                    <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
                      당신과 완벽하게 입맛이 일치하는 유저가 남긴 최고의 추출 레시피입니다. 그대로 따라 추출해볼까요?
                    </p>
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <Button
                    onClick={handleSaveGhostLog}
                    disabled={isSavingGhost}
                    className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:opacity-90 text-black rounded-xl text-xs font-extrabold border-none cursor-pointer flex items-center gap-1.5 shadow-md shadow-amber-500/20 transition-all hover:scale-[1.02]"
                  >
                    <span>{isSavingGhost ? "저장 중..." : "고스트 레시피로 추출하기"}</span>
                  </Button>
                </div>
              </div>
            </>
            )}

            {/* Brewing Notes List */}
            <div className="mt-6 space-y-3.5 max-h-[480px] overflow-y-auto pr-1.5 custom-scrollbar">
              {isLoading ? (
                <div className="space-y-2 py-8 text-center text-xs text-muted-foreground">
                  <span>기록 로딩 중...</span>
                </div>
              ) : !notes || notes.length === 0 ? (
                <div className="py-12 border border-dashed border-white/20 rounded-2xl text-center space-y-2">
                  <div className="w-10 h-10 rounded-full bg-primary-amber/10 flex items-center justify-center mx-auto text-primary-amber">
                    <Droplet size={18} />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-foreground">첫 추출 노트를 기록해보세요</h4>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      다양한 분쇄도와 물 온도로 추출해보고 커피가 맛있어지는 변수를 수집하세요.
                    </p>
                  </div>
                </div>
              ) : (
                notes.map((note) => {
                  if (editingNoteId === note.id) {
                    return (
                      <form key={note.id} onSubmit={handleUpdateNote} className="bg-white/5 border border-white/10 rounded-2xl p-4 shadow-sm space-y-3.5 animate-in fade-in duration-250">
                        <div className="grid grid-cols-3 gap-2">
                          <div className="flex flex-col gap-1">
                            <label className="text-[9px] font-bold text-muted-foreground">추출 도구</label>
                            <select
                              value={editMethod}
                              onChange={(e) => setEditMethod(e.target.value)}
                              className="border border-white/10 rounded-lg px-2 py-1 text-xs bg-black/40 text-foreground focus:ring-1 focus:ring-primary-amber outline-none"
                            >
                              {["Hario V60", "Kalita Wave", "Espresso", "AeroPress", "French Press", "Moka Pot", "Cold Brew"].map(m => (
                                <option key={m} value={m}>{m}</option>
                              ))}
                            </select>
                          </div>
                          <div className="flex flex-col gap-1">
                            <label className="text-[9px] font-bold text-muted-foreground">원두량 (g)</label>
                            <input
                              type="number"
                              step="0.1"
                              value={editBeanAmount}
                              onChange={(e) => setEditBeanAmount(parseFloat(e.target.value) || 0)}
                              className="border border-white/10 rounded-lg px-2 py-1 text-xs bg-black/40 text-foreground focus:ring-1 focus:ring-primary-amber outline-none"
                            />
                          </div>
                          <div className="flex flex-col gap-1">
                            <label className="text-[9px] font-bold text-muted-foreground">추출량 (g)</label>
                            <input
                              type="number"
                              value={editWaterAmount}
                              onChange={(e) => setEditWaterAmount(parseInt(e.target.value) || 0)}
                              className="border border-white/10 rounded-lg px-2 py-1 text-xs bg-black/40 text-foreground focus:ring-1 focus:ring-primary-amber outline-none"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-4 gap-2">
                          <div className="flex flex-col gap-1">
                            <label className="text-[9px] font-bold text-muted-foreground">분쇄도</label>
                            <input
                              type="text"
                              value={editGrindSize}
                              onChange={(e) => setEditGrindSize(e.target.value)}
                              className="border border-white/10 rounded-lg px-2 py-1 text-xs bg-black/40 text-foreground focus:ring-1 focus:ring-primary-amber outline-none"
                            />
                          </div>
                          <div className="flex flex-col gap-1">
                            <label className="text-[9px] font-bold text-muted-foreground">물 온도 (°C)</label>
                            <input
                              type="number"
                              value={editWaterTemp}
                              onChange={(e) => setEditWaterTemp(parseInt(e.target.value) || 0)}
                              className="border border-white/10 rounded-lg px-2 py-1 text-xs bg-black/40 text-foreground focus:ring-1 focus:ring-primary-amber outline-none"
                            />
                          </div>
                          <div className="flex flex-col gap-1">
                            <label className="text-[9px] font-bold text-muted-foreground">시간 (초)</label>
                            <input
                              type="number"
                              value={editBrewTime}
                              onChange={(e) => setEditBrewTime(parseInt(e.target.value) || 0)}
                              className="border border-white/10 rounded-lg px-2 py-1 text-xs bg-black/40 text-foreground focus:ring-1 focus:ring-primary-amber outline-none"
                            />
                          </div>
                          <div className="flex flex-col gap-1">
                            <label className="text-[9px] font-bold text-muted-foreground">만족도 (1-5)</label>
                            <div className="flex items-center gap-0.5 mt-1">
                              {[1, 2, 3, 4, 5].map(star => (
                                <button
                                  key={star}
                                  type="button"
                                  onClick={() => setEditRating(star)}
                                  className="text-primary-amber bg-transparent border-none cursor-pointer"
                                >
                                  <Star size={12} fill={star <= editRating ? "currentColor" : "none"} />
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-col gap-1">
                          <label className="text-[9px] font-bold text-muted-foreground">메모 및 개선점</label>
                          <textarea
                            value={editMemo}
                            onChange={(e) => setEditMemo(e.target.value)}
                            className="border border-white/10 rounded-lg px-2 py-1 text-xs h-12 resize-none bg-black/40 text-foreground focus:ring-1 focus:ring-primary-amber outline-none"
                          />
                        </div>

                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => setEditingNoteId(null)}
                            className="px-3 py-1 bg-transparent border border-white/20 hover:bg-white/10 text-foreground rounded-lg text-[10px] font-bold cursor-pointer"
                          >
                            취소
                          </button>
                          <Button
                            type="submit"
                            disabled={updateNoteMutation.isPending}
                            className="px-4 py-1 bg-primary-amber hover:opacity-90 text-[#0D0A07] rounded-lg text-[10px] font-bold border-none cursor-pointer"
                          >
                            {updateNoteMutation.isPending ? "저장 중..." : "수정 완료"}
                          </Button>
                        </div>
                      </form>
                    );
                  }

                  return (
                    <div key={note.id} className="bg-white/5 border border-white/10 rounded-2xl p-4 shadow-sm hover:border-primary-amber/30 transition-all relative group">
                      <div className="flex justify-between items-center pb-2 border-b border-white/10 text-xs">
                        <div className="flex items-center gap-1.5 font-bold">
                          <span className="bg-primary-amber/10 text-primary-amber px-2 py-0.5 rounded-md text-[10px]">
                            {note.method}
                          </span>
                          <span>{note.bean_amount}g ➡️ {note.water_amount}g</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {/* Actions (visible on hover) */}
                          <div className="flex items-center gap-1 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => handleEditStart(note)}
                              className="p-1 rounded hover:bg-white/10 text-muted-foreground hover:text-foreground border-none bg-transparent cursor-pointer"
                              title="추출 로그 수정"
                            >
                              <Edit2 size={11} />
                            </button>
                            <button
                              onClick={() => handleDeleteNote(note.id)}
                              className="p-1 rounded hover:bg-red-500/10 text-muted-foreground hover:text-red-400 border-none bg-transparent cursor-pointer"
                              title="추출 로그 삭제"
                            >
                              <Trash2 size={11} />
                            </button>
                          </div>
                          <div className="flex items-center gap-1 text-[10px] text-muted-foreground/60 ml-1">
                            <Calendar size={11} />
                            <span>{note.created_at.slice(0, 16).replace(/-/g, ".").replace("T", " ")}</span>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-4 gap-2 pt-2.5 text-[11px] text-muted-foreground font-semibold border-b border-white/5 pb-2">
                        {note.grind_size && (
                          <div className="flex items-center gap-1">
                            <Scale size={11} className="text-primary-amber" />
                            <span>분쇄: {note.grind_size}</span>
                          </div>
                        )}
                        {note.water_temp && (
                          <div className="flex items-center gap-1">
                            <Thermometer size={11} className="text-primary-amber" />
                            <span>온도: {note.water_temp}°C</span>
                          </div>
                        )}
                        {note.brew_time && (
                          <div className="flex items-center gap-1">
                            <Clock size={11} className="text-primary-amber" />
                            <span>시간: {Math.floor(note.brew_time / 60)}분 {note.brew_time % 60}초</span>
                          </div>
                        )}
                        <div className="flex items-center gap-0.5 justify-end">
                          {[1, 2, 3, 4, 5].map(star => (
                            <Star
                              key={star}
                              size={10}
                              className="text-primary-amber"
                              fill={star <= (note.rating || 0) ? "currentColor" : "none"}
                            />
                          ))}
                        </div>
                      </div>

                      {note.memo && (
                        <p className="text-[11px] text-foreground/90 leading-relaxed pt-2">
                          {note.memo}
                        </p>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Modal footer info */}
          <div className="border-t border-white/10 pt-4 text-center text-[10px] text-muted-foreground/60 mt-4">
            CoffeeDex Taste Passport | Brewing History
          </div>
        </div>
      </div>
    </div>
  );
}
