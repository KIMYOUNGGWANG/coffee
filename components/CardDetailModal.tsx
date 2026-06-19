"use client";

import React, { useState } from "react";
import { X, Calendar, Plus, Clock, Scale, Thermometer, Star, Sparkles, Droplet, Edit2, Trash2 } from "lucide-react";
import { TastingCardData, useBrewingNotes, useCreateBrewingNote, useUpdateBrewingNote, useDeleteBrewingNote } from "@/hooks/useTastingCards";
import { Button } from "./ui/button";
import FluidRadarChart from "./FluidRadarChart";
import AIBrewingGuide from "./AIBrewingGuide";

interface CardDetailModalProps {
  card: TastingCardData;
  isOpen: boolean;
  onClose: () => void;
}

export default function CardDetailModal({ card, isOpen, onClose }: CardDetailModalProps) {
  const { data: notes, isLoading } = useBrewingNotes(card.id);
  const createNoteMutation = useCreateBrewingNote(card.id);
  const updateNoteMutation = useUpdateBrewingNote(card.id);
  const deleteNoteMutation = useDeleteBrewingNote(card.id);

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
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-40 flex items-center justify-center p-4">
      <div className="glass-card border border-white/10 rounded-3xl w-full max-w-4xl shadow-2xl h-[90vh] flex flex-col md:flex-row overflow-hidden animate-in fade-in zoom-in-95 duration-200">

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
              <span className="text-[10px] uppercase font-extrabold text-foreground tracking-wider bg-white/10 px-2.5 py-1 rounded-full shadow-sm">
                {card.badges?.[0] || "Single Origin"}
              </span>
              <h2 className="font-serif text-3xl font-extrabold leading-tight text-foreground">{card.title}</h2>
              <p className="text-sm font-semibold text-muted-foreground">{card.subtitle}</p>

              {/* Image if available */}
              {card.image_url && (
                <div className="w-full aspect-[4/3] rounded-2xl overflow-hidden border border-white/10 bg-white/5 shadow-inner">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={card.image_url} alt={card.title} className="w-full h-full object-cover" />
                </div>
              )}

              {/* Taste profile Radar Chart */}
              <div className="py-4 flex justify-center w-full">
                <FluidRadarChart
                  acidity={card.metric1}
                  sweetness={card.metric2}
                  body={card.metric3}
                  size={200}
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
              AI Cup Note
            </span>
            <p className="font-serif text-xs italic text-foreground/90 leading-relaxed pt-1.5 font-medium">
              “{card.ai_description || "느껴지는 아로마 노트를 기록하고 AI 감성 한줄평을 생성해보세요."}”
            </p>
          </div>

          <AIBrewingGuide card={card} />
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

            {/* Brewing Note Input Form */}
            {isFormOpen && (
              <form onSubmit={handleSubmitNote} className="mt-4 p-4 border border-white/10 bg-white/5 rounded-2xl space-y-4 animate-in slide-in-from-top-4 duration-200">
                <div className="grid grid-cols-3 gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-muted-foreground">추출 도구</label>
                    <select
                      value={method}
                      onChange={(e) => setMethod(e.target.value)}
                      className="border border-white/10 rounded-lg px-2 py-1.5 text-xs bg-black/40 text-foreground focus:ring-1 focus:ring-primary-amber outline-none"
                    >
                      {["Hario V60", "Kalita Wave", "Espresso", "AeroPress", "French Press", "Moka Pot", "Cold Brew"].map(m => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-muted-foreground">원두량 (g)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={beanAmount}
                      onChange={(e) => setBeanAmount(parseFloat(e.target.value) || 0)}
                      className="border border-white/10 rounded-lg px-2 py-1.5 text-xs bg-black/40 text-foreground focus:ring-1 focus:ring-primary-amber outline-none"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-muted-foreground">추출량 (g)</label>
                    <input
                      type="number"
                      value={waterAmount}
                      onChange={(e) => setWaterAmount(parseInt(e.target.value) || 0)}
                      className="border border-white/10 rounded-lg px-2 py-1.5 text-xs bg-black/40 text-foreground focus:ring-1 focus:ring-primary-amber outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-muted-foreground">분쇄도</label>
                    <input
                      type="text"
                      placeholder="예: 24 Clicks"
                      value={grindSize}
                      onChange={(e) => setGrindSize(e.target.value)}
                      className="border border-white/10 rounded-lg px-2 py-1.5 text-xs bg-black/40 text-foreground focus:ring-1 focus:ring-primary-amber outline-none"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-muted-foreground">물 온도 (°C)</label>
                    <input
                      type="number"
                      value={waterTemp}
                      onChange={(e) => setWaterTemp(parseInt(e.target.value) || 0)}
                      className="border border-white/10 rounded-lg px-2 py-1.5 text-xs bg-black/40 text-foreground focus:ring-1 focus:ring-primary-amber outline-none"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-muted-foreground">시간 (초)</label>
                    <input
                      type="number"
                      value={brewTime}
                      onChange={(e) => setBrewTime(parseInt(e.target.value) || 0)}
                      className="border border-white/10 rounded-lg px-2 py-1.5 text-xs bg-black/40 text-foreground focus:ring-1 focus:ring-primary-amber outline-none"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-muted-foreground">만족도 (1-5)</label>
                    <div className="flex items-center gap-0.5 mt-1">
                      {[1, 2, 3, 4, 5].map(star => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setRating(star)}
                          className="text-primary-amber hover:scale-110 transition-transform bg-transparent border-none cursor-pointer"
                        >
                          <Star size={14} fill={star <= rating ? "currentColor" : "none"} />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-muted-foreground">메모 및 개선점</label>
                  <textarea
                    placeholder="분쇄도를 조금 더 굵게 하니 쓴맛이 줄고 산뜻해졌음."
                    value={memo}
                    onChange={(e) => setMemo(e.target.value)}
                    className="border border-white/10 rounded-lg px-2.5 py-1.5 text-xs h-14 resize-none bg-black/40 text-foreground focus:ring-1 focus:ring-primary-amber outline-none"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setIsFormOpen(false)}
                    className="px-3 py-1.5 bg-transparent border border-white/20 hover:bg-white/10 text-foreground rounded-xl text-xs font-bold cursor-pointer"
                  >
                    취소
                  </button>
                  <Button
                    type="submit"
                    disabled={createNoteMutation.isPending}
                    className="px-4 py-1.5 bg-primary-amber hover:opacity-90 text-[#0D0A07] rounded-xl text-xs font-bold border-none cursor-pointer"
                  >
                    {createNoteMutation.isPending ? "저장 중..." : "추출 노트 추가"}
                  </Button>
                </div>
              </form>
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
