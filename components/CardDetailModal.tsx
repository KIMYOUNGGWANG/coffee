"use client";

import React, { useState } from "react";
import { X, Calendar, Plus, Clock, Scale, Thermometer, Star, Sparkles, Droplet } from "lucide-react";
import { TastingCardData, useBrewingNotes, useCreateBrewingNote } from "@/hooks/useTastingCards";
import { Button } from "./ui/button";

interface CardDetailModalProps {
  card: TastingCardData;
  isOpen: boolean;
  onClose: () => void;
}

export default function CardDetailModal({ card, isOpen, onClose }: CardDetailModalProps) {
  const { data: notes, isLoading } = useBrewingNotes(card.id);
  const createNoteMutation = useCreateBrewingNote(card.id);

  // Form states for a new brewing log
  const [method, setMethod] = useState("Hario V60");
  const [beanAmount, setBeanAmount] = useState<number>(15);
  const [waterAmount, setWaterAmount] = useState<number>(225);
  const [grindSize, setGrindSize] = useState("");
  const [waterTemp, setWaterTemp] = useState<number>(92);
  const [brewTime, setBrewTime] = useState<number>(150); // in seconds
  const [rating, setRating] = useState<number>(3);
  const [memo, setMemo] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);

  if (!isOpen) return null;

  const handleSubmitNote = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createNoteMutation.mutateAsync({
        method,
        beanAmount,
        waterAmount,
        grindSize: grindSize || null,
        waterTemp,
        brewTime,
        rating,
        memo: memo || null,
      });

      // Reset form and close
      setGrindSize("");
      setMemo("");
      setRating(3);
      setIsFormOpen(false);
    } catch (err) {
      console.error("Failed to save brewing note:", err);
      alert("추출 노트를 추가하는 데 실패했습니다.");
    }
  };

  return (
    <div className="fixed inset-0 bg-espresso/60 backdrop-blur-sm z-40 flex items-center justify-center p-4">
      <div className="bg-white border border-warm-gray rounded-3xl w-full max-w-4xl shadow-2xl h-[90vh] flex flex-col md:flex-row overflow-hidden animate-in fade-in zoom-in-95 duration-200 text-espresso">

        {/* Left Pane: Tasting Card Display & AI description */}
        <div className="w-full md:w-5/12 bg-cream p-6 md:p-8 flex flex-col justify-between border-b md:border-b-0 md:border-r border-warm-gray overflow-y-auto">
          <div>
            <div className="flex justify-between items-center pb-3 border-b border-warm-gray">
              <span className="text-[10px] uppercase tracking-wider font-bold text-espresso/45">Hyangmi details</span>
              <button
                onClick={onClose}
                className="md:hidden p-1.5 rounded-full hover:bg-warm-gray/30 text-espresso/60"
              >
                <X size={16} />
              </button>
            </div>

            {/* Coffee details info */}
            <div className="mt-6 space-y-4">
              <span className="text-[10px] uppercase font-extrabold text-caramel tracking-wider bg-caramel/10 px-2.5 py-1 rounded-full">
                {card.badges?.[0] || "Single Origin"}
              </span>
              <h2 className="font-serif text-2xl font-extrabold leading-tight text-espresso">{card.title}</h2>
              <p className="text-sm font-semibold text-espresso/60">{card.subtitle}</p>

              {/* Image if available */}
              {card.image_url && (
                <div className="w-full aspect-[4/3] rounded-2xl overflow-hidden border border-warm-gray bg-white shadow-inner">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={card.image_url} alt={card.title} className="w-full h-full object-cover" />
                </div>
              )}

              {/* Taste profile sliders */}
              <div className="space-y-3 pt-2">
                <div className="flex flex-col gap-1">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-espresso/50">산미 (Acidity)</span>
                    <span>{card.metric1} / 5</span>
                  </div>
                  <div className="h-1.5 bg-warm-gray rounded-full overflow-hidden">
                    <div className="h-full bg-caramel transition-all duration-300" style={{ width: `${(card.metric1 / 5) * 100}%` }} />
                  </div>
                </div>
                <div className="flex flex-col gap-1">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-espresso/50">단맛 (Sweetness)</span>
                    <span>{card.metric2} / 5</span>
                  </div>
                  <div className="h-1.5 bg-warm-gray rounded-full overflow-hidden">
                    <div className="h-full bg-caramel transition-all duration-300" style={{ width: `${(card.metric2 / 5) * 100}%` }} />
                  </div>
                </div>
                <div className="flex flex-col gap-1">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-espresso/50">바디감 (Body)</span>
                    <span>{card.metric3} / 5</span>
                  </div>
                  <div className="h-1.5 bg-warm-gray rounded-full overflow-hidden">
                    <div className="h-full bg-caramel transition-all duration-300" style={{ width: `${(card.metric3 / 5) * 100}%` }} />
                  </div>
                </div>
              </div>

              {/* Flavor Tags */}
              <div className="flex flex-wrap gap-1.5 pt-2">
                {card.tags.map((tag, i) => (
                  <span key={i} className="text-xs px-2.5 py-1 bg-white border border-warm-gray rounded-full text-espresso/80 font-medium">
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* AI Narrative Quote block */}
          <div className="mt-8 bg-white border border-warm-gray/60 p-4 rounded-2xl relative shadow-sm">
            <span className="absolute -top-3 left-4 bg-white px-2 text-[9px] uppercase font-bold text-caramel tracking-wider border border-warm-gray/60 rounded-full flex items-center gap-1">
              <Sparkles size={9} />
              AI Cup Note
            </span>
            <p className="font-serif text-xs italic text-espresso/90 leading-relaxed pt-1.5">
              “{card.ai_description || "느껴지는 아로마 노트를 기록하고 AI 감성 한줄평을 생성해보세요."}”
            </p>
          </div>
        </div>

        {/* Right Pane: 1:N Brewing Notes List & Logger Form */}
        <div className="flex-1 p-6 md:p-8 flex flex-col justify-between overflow-y-auto">
          <div>
            <div className="flex justify-between items-center pb-4 border-b border-warm-gray">
              <div>
                <h3 className="font-serif font-bold text-lg">추출 기록 (Brewing Notes)</h3>
                <p className="text-xs text-espresso/50">원두를 소진하는 동안 기록한 다양한 추출법 히스토리입니다.</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsFormOpen(!isFormOpen)}
                  className="px-3 py-1.5 bg-espresso hover:bg-espresso/90 text-white rounded-xl text-xs font-bold flex items-center gap-1 shadow-sm transition-all"
                >
                  <Plus size={13} />
                  <span>새 기록 쓰기</span>
                </button>
                <button
                  onClick={onClose}
                  className="hidden md:block p-1.5 rounded-full hover:bg-warm-gray/30 text-espresso/60 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Brewing Note Input Form */}
            {isFormOpen && (
              <form onSubmit={handleSubmitNote} className="mt-4 p-4 border border-caramel/20 bg-cream/30 rounded-2xl space-y-4 animate-in slide-in-from-top-4 duration-200">
                <div className="grid grid-cols-3 gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-espresso/60">추출 도구</label>
                    <select
                      value={method}
                      onChange={(e) => setMethod(e.target.value)}
                      className="border border-warm-gray rounded-lg px-2 py-1.5 text-xs bg-white"
                    >
                      {["Hario V60", "Kalita Wave", "Espresso", "AeroPress", "French Press", "Moka Pot", "Cold Brew"].map(m => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-espresso/60">원두량 (g)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={beanAmount}
                      onChange={(e) => setBeanAmount(parseFloat(e.target.value) || 0)}
                      className="border border-warm-gray rounded-lg px-2 py-1.5 text-xs bg-white"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-espresso/60">추출량 (g)</label>
                    <input
                      type="number"
                      value={waterAmount}
                      onChange={(e) => setWaterAmount(parseInt(e.target.value) || 0)}
                      className="border border-warm-gray rounded-lg px-2 py-1.5 text-xs bg-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-espresso/60">분쇄도</label>
                    <input
                      type="text"
                      placeholder="예: 24 Clicks"
                      value={grindSize}
                      onChange={(e) => setGrindSize(e.target.value)}
                      className="border border-warm-gray rounded-lg px-2 py-1.5 text-xs bg-white"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-espresso/60">물 온도 (°C)</label>
                    <input
                      type="number"
                      value={waterTemp}
                      onChange={(e) => setWaterTemp(parseInt(e.target.value) || 0)}
                      className="border border-warm-gray rounded-lg px-2 py-1.5 text-xs bg-white"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-espresso/60">시간 (초)</label>
                    <input
                      type="number"
                      value={brewTime}
                      onChange={(e) => setBrewTime(parseInt(e.target.value) || 0)}
                      className="border border-warm-gray rounded-lg px-2 py-1.5 text-xs bg-white"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-espresso/60">만족도 (1-5)</label>
                    <div className="flex items-center gap-0.5 mt-1">
                      {[1, 2, 3, 4, 5].map(star => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setRating(star)}
                          className="text-caramel hover:scale-110 transition-transform"
                        >
                          <Star size={14} fill={star <= rating ? "currentColor" : "none"} />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-espresso/60">메모 및 개선점</label>
                  <textarea
                    placeholder="분쇄도를 조금 더 굵게 하니 쓴맛이 줄고 산뜻해졌음."
                    value={memo}
                    onChange={(e) => setMemo(e.target.value)}
                    className="border border-warm-gray rounded-lg px-2.5 py-1.5 text-xs h-14 resize-none bg-white"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setIsFormOpen(false)}
                    className="px-3 py-1.5 bg-white border border-warm-gray hover:bg-warm-gray/10 text-espresso rounded-xl text-xs font-bold"
                  >
                    취소
                  </button>
                  <Button
                    type="submit"
                    disabled={createNoteMutation.isPending}
                    className="px-4 py-1.5 bg-caramel hover:bg-caramel/90 text-white rounded-xl text-xs font-bold"
                  >
                    {createNoteMutation.isPending ? "저장 중..." : "추출 노트 추가"}
                  </Button>
                </div>
              </form>
            )}

            {/* Brewing Notes List */}
            <div className="mt-6 space-y-3.5 max-h-[480px] overflow-y-auto pr-1.5">
              {isLoading ? (
                <div className="space-y-2 py-8 text-center text-xs text-espresso/50">
                  <span>기록 로딩 중...</span>
                </div>
              ) : !notes || notes.length === 0 ? (
                <div className="py-12 border border-dashed border-warm-gray rounded-2xl text-center space-y-2">
                  <div className="w-10 h-10 rounded-full bg-cream border border-warm-gray flex items-center justify-center mx-auto text-caramel/40">
                    <Droplet size={18} />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold">첫 추출 노트를 기록해보세요</h4>
                    <p className="text-[10px] text-espresso/50 mt-0.5">
                      다양한 분쇄도와 물 온도로 추출해보고 커피가 맛있어지는 변수를 수집하세요.
                    </p>
                  </div>
                </div>
              ) : (
                notes.map((note) => (
                  <div key={note.id} className="bg-[#fcfcfa] border border-warm-gray rounded-2xl p-4 shadow-sm hover:border-caramel/20 transition-all">
                    <div className="flex justify-between items-center pb-2 border-b border-warm-gray/60 text-xs">
                      <div className="flex items-center gap-1.5 font-bold">
                        <span className="bg-caramel/10 text-caramel px-2 py-0.5 rounded-md text-[10px]">
                          {note.method}
                        </span>
                        <span>{note.bean_amount}g ➡️ {note.water_amount}g</span>
                      </div>
                      <div className="flex items-center gap-1 text-[10px] text-espresso/45">
                        <Calendar size={11} />
                        <span>{note.created_at.slice(0, 16).replace(/-/g, ".").replace("T", " ")}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-4 gap-2 pt-2.5 text-[11px] text-espresso/60 font-semibold border-b border-warm-gray/30 pb-2">
                      {note.grind_size && (
                        <div className="flex items-center gap-1">
                          <Scale size={11} className="text-caramel/75" />
                          <span>분쇄: {note.grind_size}</span>
                        </div>
                      )}
                      {note.water_temp && (
                        <div className="flex items-center gap-1">
                          <Thermometer size={11} className="text-caramel/75" />
                          <span>온도: {note.water_temp}°C</span>
                        </div>
                      )}
                      {note.brew_time && (
                        <div className="flex items-center gap-1">
                          <Clock size={11} className="text-caramel/75" />
                          <span>시간: {Math.floor(note.brew_time / 60)}분 {note.brew_time % 60}초</span>
                        </div>
                      )}
                      <div className="flex items-center gap-0.5 justify-end">
                        {[1, 2, 3, 4, 5].map(star => (
                          <Star
                            key={star}
                            size={10}
                            className="text-caramel"
                            fill={star <= (note.rating || 0) ? "currentColor" : "none"}
                          />
                        ))}
                      </div>
                    </div>

                    {note.memo && (
                      <p className="text-[11px] text-espresso/85 leading-relaxed pt-2">
                        {note.memo}
                      </p>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Modal footer info */}
          <div className="border-t border-warm-gray pt-4 text-center text-[10px] text-espresso/40">
            Hyangmi Relational Engine v1.1 | 1:N Brewing Notes Tracker
          </div>
        </div>
      </div>
    </div>
  );
}
