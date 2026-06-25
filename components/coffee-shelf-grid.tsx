"use client";

import Link from "next/link";
import React, { useEffect, useState } from "react";
import { Coffee, Plus, Trash2, Archive, Loader2, Sparkles, AlertCircle, Calendar, Weight, Scale, X, ScanLine } from "lucide-react";
import { Button } from "@/components/ui/button";
import { buildAuthGateHref } from "@/lib/auth-redirect";
import { evaluateFreshShelfStatus, type FreshShelfStatus } from "@/lib/fresh-shelf";
import { cn } from "@/lib/utils";
import { motion, useMotionValue, useSpring, useTransform } from "motion/react";
import { CoffeePackageItem } from "./shelf/CoffeePackageItem";
import { SmartScanner } from "./upload/SmartScanner";
import type { ScanResult } from "@/app/api/v1/scan/route";
import { TiltCard } from "@/components/ui/tilt-card";

interface TastingCard {
  id: string;
  title: string;
  subtitle: string;
}

// Local TiltCard removed, using imported shared TiltCard instead

interface ShelfItem {
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
  tasting_cards?: TastingCard | null;
}

interface CoffeeShelfGridProps {
  onItemSelect?: (item: ShelfItem) => void;
  refreshTrigger?: number;
  onDataChange?: () => void;
}

async function readJsonResponse(response: Response): Promise<unknown> {
  const text = await response.text();
  if (text.trim().length === 0) return {};

  try {
    return JSON.parse(text);
  } catch {
    return {};
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object";
}

function isTastingCard(value: unknown): value is TastingCard {
  if (!isRecord(value)) return false;

  return (
    typeof value.id === "string"
    && typeof value.title === "string"
    && typeof value.subtitle === "string"
  );
}

function isShelfItem(value: unknown): value is ShelfItem {
  if (!isRecord(value)) return false;

  const tastingCard = value.tasting_cards;

  return (
    typeof value.id === "string"
    && typeof value.roaster_name === "string"
    && typeof value.bean_name === "string"
    && (typeof value.origin === "string" || value.origin === null)
    && (typeof value.roast_date === "string" || value.roast_date === null)
    && (typeof value.opened_date === "string" || value.opened_date === null)
    && typeof value.total_weight === "number"
    && typeof value.fill_level === "number"
    && typeof value.is_finished === "boolean"
    && (typeof value.tasting_card_id === "string" || value.tasting_card_id === null)
    && (tastingCard === undefined || tastingCard === null || isTastingCard(tastingCard))
  );
}

function readShelfItems(payload: unknown): ShelfItem[] {
  if (!isRecord(payload) || !Array.isArray(payload.data)) return [];

  return payload.data.filter(isShelfItem);
}

function readTastingCards(payload: unknown): TastingCard[] {
  if (!isRecord(payload) || !Array.isArray(payload.data)) return [];

  return payload.data.filter(isTastingCard);
}

function getApiErrorMessage(payload: unknown, fallbackMessage: string): string {
  if (!isRecord(payload) || !isRecord(payload.error)) return fallbackMessage;

  const message = payload.error.message;
  return typeof message === "string" && message.trim().length > 0 ? message : fallbackMessage;
}

function assertShelfResponseOk(response: Response, payload: unknown, fallbackMessage: string): void {
  if (response.ok) return;

  throw new Error(getApiErrorMessage(payload, fallbackMessage));
}

export default function CoffeeShelfGrid({ onItemSelect, refreshTrigger = 0, onDataChange }: CoffeeShelfGridProps) {
  const [items, setItems] = useState<ShelfItem[]>([]);
  const [archivedItems, setArchivedItems] = useState<ShelfItem[]>([]);
  const [tastingCards, setTastingCards] = useState<TastingCard[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthRequired, setIsAuthRequired] = useState(false);
  const [loadErrorMessage, setLoadErrorMessage] = useState<string | null>(null);
  const [showArchived, setShowArchived] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  // Form State
  const [roasterName, setRoasterName] = useState("");
  const [beanName, setBeanName] = useState("");
  const [origin, setOrigin] = useState("");
  const [roastDate, setRoastDate] = useState("");
  const [openedDate, setOpenedDate] = useState("");
  const [totalWeight, setTotalWeight] = useState(200);
  const [tastingCardId, setTastingCardId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleScanComplete = (result: ScanResult) => {
    setRoasterName(result.roasterName || "");
    setBeanName(result.beanName || "");
    const originParts = [result.origin, result.process].filter(Boolean);
    setOrigin(originParts.join(", "));
    if (result.roastDate) setRoastDate(result.roastDate);
    if (result.weight) {
      const weightNum = parseInt(result.weight.replace(/[^0-9]/g, ""), 10);
      if (!isNaN(weightNum) && weightNum > 0) setTotalWeight(weightNum);
    }
    setIsScannerOpen(false);
    setIsDialogOpen(true);
  };

  const handleQuickSave = async (result: ScanResult, rating: number, wantAgain: boolean) => {
    try {
      setIsSubmitting(true);
      
      let parsedWeight = 200;
      if (result.weight) {
        const weightNum = parseInt(result.weight.replace(/[^0-9]/g, ""), 10);
        if (!isNaN(weightNum) && weightNum > 0) {
          parsedWeight = weightNum;
        }
      }

      let formattedRoastDate = null;
      if (result.roastDate && /^\d{4}-\d{2}-\d{2}$/.test(result.roastDate)) {
        formattedRoastDate = result.roastDate;
      } else if (result.roastDate) {
        const match = result.roastDate.match(/^(\d{4})[-/.]?(\d{2})[-/.]?(\d{2})$/);
        if (match) {
          formattedRoastDate = `${match[1]}-${match[2]}-${match[3]}`;
        } else {
          try {
            const parsedDate = new Date(result.roastDate);
            if (!isNaN(parsedDate.getTime())) {
              formattedRoastDate = parsedDate.toISOString().split('T')[0];
            }
          } catch {}
        }
      }

      const originParts = [result.origin, result.process].filter(Boolean);
      const combinedOrigin = originParts.join(", ") || null;

      const payload = {
        roasterName: result.roasterName || "기타 로스터리",
        beanName: result.beanName || "스캔된 원두",
        origin: combinedOrigin,
        roastDate: formattedRoastDate,
        openedDate: null,
        totalWeight: parsedWeight,
        fillLevel: 100,
        tastingCardId: null,
        rating,
        wantAgain,
      };

      const response = await fetch("/api/v1/shelf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await readJsonResponse(response);

      if (response.status === 401) {
        setIsScannerOpen(false);
        setIsAuthRequired(true);
        return;
      }

      assertShelfResponseOk(response, json, "원두 퀵 등록 중 오류가 발생했습니다.");

      setIsScannerOpen(false);
      fetchShelfData();
    } catch (error) {
      if (error instanceof Error) {
        console.error("Error quick-saving shelf item:", error);
        alert(error.message);
      } else {
        console.error("Error quick-saving shelf item:", String(error));
        alert("원두 등록 중 오류가 발생했습니다.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const fetchShelfData = async () => {
    try {
      setIsLoading(true);
      setIsAuthRequired(false);
      setLoadErrorMessage(null);
      
      // Mock test mode bypass
      if (typeof window !== "undefined" && localStorage.getItem("mock_test_mode") === "true") {
        setItems([{
          id: "mock-shelf-1",
          user_id: "mock-user",
          roaster_name: "모범로스터리",
          bean_name: "에티오피아 예가체프 아리차",
          origin: "에티오피아",
          roast_date: new Date().toISOString().split("T")[0],
          opened_date: null,
          total_weight: 200,
          fill_level: 50,
          is_finished: false,
          tasting_card_id: null,
        } as ShelfItem]);
        setArchivedItems([]);
        setTastingCards([]);
        setIsLoading(false);
        return;
      }
      
      // Fetch active items
      const activeResponse = await fetch("/api/v1/shelf?include_finished=false");
      const activeData = await readJsonResponse(activeResponse);
      if (activeResponse.status === 401) {
        setItems([]);
        setArchivedItems([]);
        setTastingCards([]);
        setIsAuthRequired(true);
        return;
      }
      assertShelfResponseOk(activeResponse, activeData, "원두 보관함 정보를 불러오지 못했습니다.");
      const activeItems = readShelfItems(activeData);
      setItems(activeItems);

      // Fetch archived items
      const archivedResponse = await fetch("/api/v1/shelf?include_finished=true");
      const archivedData = await readJsonResponse(archivedResponse);
      if (archivedResponse.status === 401) {
        setArchivedItems([]);
        setTastingCards([]);
        setIsAuthRequired(true);
        return;
      }
      assertShelfResponseOk(archivedResponse, archivedData, "다 마신 원두 히스토리를 불러오지 못했습니다.");
      const archivedShelfItems = readShelfItems(archivedData);
      const activeIds = new Set(activeItems.map(item => item.id));
      const strictlyArchived = archivedShelfItems.filter(item => !activeIds.has(item.id));
      setArchivedItems(strictlyArchived);

      // Fetch user's tasting cards to link
      const cardsResponse = await fetch("/api/v1/cards");
      const cardsData = await readJsonResponse(cardsResponse);
      if (cardsResponse.status === 401) {
        setTastingCards([]);
        setIsAuthRequired(true);
        return;
      }
      assertShelfResponseOk(cardsResponse, cardsData, "테이스팅 카드를 불러오지 못했습니다.");
      setTastingCards(readTastingCards(cardsData));
      onDataChange?.();
    } catch (error) {
      if (error instanceof Error) {
        console.error("Error fetching shelf data:", error);
        setLoadErrorMessage(error.message);
      } else {
        console.error("Error fetching shelf data:", String(error));
        setLoadErrorMessage("원두 보관함 정보를 불러오지 못했습니다.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchShelfData();
  }, [refreshTrigger]);

  const handleCreateItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roasterName || !beanName) {
      alert("로스터리와 원두 이름은 필수 항목입니다.");
      return;
    }

    try {
      setIsSubmitting(true);
      const payload = {
        roasterName,
        beanName,
        origin: origin || null,
        roastDate: roastDate || null,
        openedDate: openedDate || null,
        totalWeight: Number(totalWeight),
        fillLevel: 100,
        tastingCardId: tastingCardId || null,
      };

      const response = await fetch("/api/v1/shelf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await readJsonResponse(response);

      if (response.status === 401) {
        setIsDialogOpen(false);
        setIsAuthRequired(true);
        return;
      }

      assertShelfResponseOk(response, json, "원두 등록 중 오류가 발생했습니다.");

      alert("새 원두를 보관함에 추가했습니다!");
      setIsDialogOpen(false);
      resetForm();
      fetchShelfData();
    } catch (error) {
      if (error instanceof Error) {
        console.error("Error creating shelf item:", error);
        alert(error.message);
      } else {
        console.error("Error creating shelf item:", String(error));
        alert("원두 등록 중 오류가 발생했습니다.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateFillLevel = async (id: string, newLevel: number) => {
    try {
      const response = await fetch(`/api/v1/shelf/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fillLevel: newLevel }),
      });

      if (!response.ok) throw new Error("Failed to update");
      fetchShelfData();
    } catch (error) {
      if (error instanceof Error) {
        console.error("Error updating fill level:", error);
      } else {
        console.error("Error updating fill level:", String(error));
      }
      alert("원두 잔량 업데이트 중 오류가 발생했습니다.");
    }
  };

  const handleToggleFinished = async (id: string, isFinished: boolean) => {
    try {
      const response = await fetch(`/api/v1/shelf/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isFinished }),
      });

      if (!response.ok) throw new Error("Failed to update");

      if (isFinished) {
        alert("원두를 다 마셨습니다! 보관함에서 비워집니다.");
      } else {
        alert("원두를 다시 활성화했습니다.");
      }
      fetchShelfData();
    } catch (error) {
      if (error instanceof Error) {
        console.error("Error toggling finish state:", error);
      } else {
        console.error("Error toggling finish state:", String(error));
      }
      alert("원두 상태 업데이트 중 오류가 발생했습니다.");
    }
  };

  const handleDeleteItem = async (id: string) => {
    if (!confirm("정말 이 원두를 보관함에서 영구 삭제하시겠습니까?")) return;
    try {
      const response = await fetch(`/api/v1/shelf/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete");

      alert("원두를 보관함에서 완전히 삭제했습니다.");
      fetchShelfData();
    } catch (error) {
      if (error instanceof Error) {
        console.error("Error deleting item:", error);
      } else {
        console.error("Error deleting item:", String(error));
      }
      alert("원두 삭제 중 오류가 발생했습니다.");
    }
  };

  const handleImportTastingCard = (cardId: string) => {
    const selectedCard = tastingCards.find(c => c.id === cardId);
    if (selectedCard) {
      setBeanName(selectedCard.title);
      setRoasterName(selectedCard.subtitle);
      setTastingCardId(cardId);
    }
  };

  const resetForm = () => {
    setRoasterName("");
    setBeanName("");
    setOrigin("");
    setRoastDate("");
    setOpenedDate("");
    setTotalWeight(200);
    setTastingCardId("");
  };

  const getFillLevelColor = (level: number) => {
    if (level > 50) return "bg-[#b87d4b]"; // Caramel Gold (Accent)
    if (level > 20) return "bg-[#996336]"; // Dark Caramel
    return "bg-[#d9463e]"; // Crimson (Warning)
  };

  const getRoastColorClasses = (roasterName: string, beanName: string, origin: string | null) => {
    const allText = `${roasterName} ${beanName} ${origin || ""}`.toLowerCase();
    if (allText.includes('light') || allText.includes('약배전')) {
      return 'bg-[#FCEADE] group-hover:bg-[#FCEADE]';
    }
    if (allText.includes('dark') || allText.includes('강배전')) {
      return 'bg-[#8C5E35]/60 group-hover:bg-[#8C5E35]';
    }
    return 'bg-[#E5C09B]/60 group-hover:bg-[#E5C09B]'; // default medium
  };

  const getFreshShelfToneClasses = (tone: FreshShelfStatus["tone"]) => {
    switch (tone) {
      case "resting":
        return "border-[#dfa857]/30 bg-[#dfa857]/10 text-[#f2c27d]";
      case "fresh":
        return "border-[#4d7c54]/35 bg-[#4d7c54]/15 text-[#9fca9a]";
      case "warning":
        return "border-[#b87d4b]/35 bg-[#b87d4b]/15 text-[#f0b978]";
      case "critical":
        return "border-[#d9463e]/35 bg-[#d9463e]/15 text-[#f39a92]";
    }
  };

  const degassedItemsCount = items.filter((item) => {
    if (!item.roast_date || item.is_finished) return false;
    const roastDate = new Date(item.roast_date);
    const diffDays = Math.floor((new Date().getTime() - roastDate.getTime()) / (1000 * 3600 * 24));
    return diffDays > 7;
  }).length;

  return (
    <div className="space-y-8">
      {/* Header and Add button */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-border pb-4">
        <div>
          <h2 className="text-xl font-bold font-serif text-foreground flex items-center gap-2">
            <Coffee className="text-primary-amber" size={20} />
            원두 보관함 (Coffee Shelf)
          </h2>
          <p className="text-xs text-muted-foreground mt-1">
            현재 개봉하여 드시고 계시는 원두들의 남은 분량을 시각적으로 관리하고 추출에 활용해 보세요.
          </p>
        </div>

        {!isAuthRequired && !loadErrorMessage && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsScannerOpen(true)}
              className="bg-[#D4AF37] hover:opacity-90 text-black rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 h-10 px-4 py-2 cursor-pointer border-none"
            >
              <ScanLine size={15} />
              AI 스캔 등록
            </button>
            <button
              onClick={() => setIsDialogOpen(true)}
              className="bg-white/5 hover:bg-white/10 text-white/70 hover:text-white border border-white/10 rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 h-10 px-4 py-2 cursor-pointer"
            >
              <Plus size={15} />
              직접 입력
            </button>
          </div>
        )}
      </div>

      {degassedItemsCount > 0 && !isLoading && !isAuthRequired && !loadErrorMessage && items.length > 0 && (
        <div className="bg-primary-amber/10 border border-primary-amber/30 rounded-2xl p-4 flex items-center gap-3 animate-in fade-in zoom-in-95 duration-300 shadow-sm">
          <div className="bg-primary-amber/20 p-2 rounded-full text-primary-amber">
            <Sparkles size={18} />
          </div>
          <div>
            <h4 className="text-sm font-bold text-primary-amber tracking-tight">디개싱(Degassing) 완료!</h4>
            <p className="text-[11px] text-primary-amber/80 mt-0.5">
              선반 위 <strong className="text-primary-amber">{degassedItemsCount}</strong>개의 원두가 로스팅 후 7일이 지나 향미가 안정화되었습니다. 지금 바로 추출하기 가장 좋은 타이밍이에요.
            </p>
          </div>
        </div>
      )}

      {/* Custom Dialog / Modal Portal */}
      {isDialogOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-card max-w-md w-full p-6 shadow-2xl space-y-4 relative animate-in fade-in zoom-in-95 duration-200">
            {/* Close Button */}
            <button
              onClick={() => { setIsDialogOpen(false); resetForm(); }}
              className="absolute top-4 right-4 p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-white/10 transition-colors border-none cursor-pointer bg-transparent"
            >
              <X size={18} />
            </button>

            <div className="space-y-1">
              <h3 className="font-serif font-bold text-foreground text-lg">새 원두 보관함에 추가</h3>
              <p className="text-[11px] text-muted-foreground">선반 위에 올릴 스페셜티 원두의 세부 정보를 입력하세요.</p>
            </div>

            <form onSubmit={handleCreateItem} className="space-y-4 pt-2">
              {tastingCards.length > 0 && (
                <div className="space-y-1">
                  <label htmlFor="import-card" className="text-xs font-semibold text-muted-foreground">작성한 테이스팅 노트에서 불러오기 (선택)</label>
                  <select
                    id="import-card"
                    className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary-amber/20 focus:border-primary-amber"
                    value={tastingCardId}
                    onChange={(e) => handleImportTastingCard(e.target.value)}
                  >
                    <option value="">-- 노트를 선택하면 정보가 자동 입력됩니다 --</option>
                    {tastingCards.map(c => (
                      <option key={c.id} value={c.id}>
                        [{c.subtitle}] {c.title}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label htmlFor="roaster" className="text-xs font-bold text-foreground">로스터리 이름 *</label>
                  <input
                    id="roaster"
                    placeholder="예: 프릳츠, 센터커피"
                    value={roasterName}
                    onChange={e => setRoasterName(e.target.value)}
                    className="w-full bg-black/20 border border-white/10 rounded-xl px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary-amber/20 focus:border-primary-amber placeholder:text-muted-foreground/50"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label htmlFor="bean" className="text-xs font-bold text-foreground">원두 이름 *</label>
                  <input
                    id="bean"
                    placeholder="예: 서울 시네마, 에티오피아 예가체프"
                    value={beanName}
                    onChange={e => setBeanName(e.target.value)}
                    className="w-full bg-black/20 border border-white/10 rounded-xl px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary-amber/20 focus:border-primary-amber placeholder:text-muted-foreground/50"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label htmlFor="origin" className="text-xs font-semibold text-muted-foreground">가공방식 및 원산지 정보</label>
                <input
                  id="origin"
                  placeholder="예: Ethiopia Natural, Washed, 무산소 발효"
                  value={origin}
                  onChange={e => setOrigin(e.target.value)}
                  className="w-full bg-black/20 border border-white/10 rounded-xl px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary-amber/20 focus:border-primary-amber placeholder:text-muted-foreground/50"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="space-y-1 col-span-1">
                  <label htmlFor="weight" className="text-xs font-semibold text-muted-foreground">용량(g)</label>
                  <input
                    id="weight"
                    type="number"
                    value={totalWeight}
                    onChange={e => setTotalWeight(Number(e.target.value))}
                    className="w-full bg-black/20 border border-white/10 rounded-xl px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary-amber/20 focus:border-primary-amber"
                    min="1"
                  />
                </div>
                <div className="space-y-1 col-span-1">
                  <label htmlFor="roast-date" className="text-xs font-semibold text-muted-foreground">로스팅 일자</label>
                  <input
                    id="roast-date"
                    type="date"
                    value={roastDate}
                    onChange={e => setRoastDate(e.target.value)}
                    className="w-full bg-black/20 border border-white/10 rounded-xl px-3 py-2 text-[10px] text-foreground focus:outline-none"
                  />
                </div>
                <div className="space-y-1 col-span-1">
                  <label htmlFor="opened-date" className="text-xs font-semibold text-muted-foreground">개봉 일자</label>
                  <input
                    id="opened-date"
                    type="date"
                    value={openedDate}
                    onChange={e => setOpenedDate(e.target.value)}
                    className="w-full bg-black/20 border border-white/10 rounded-xl px-3 py-2 text-[10px] text-foreground focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-white/10">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => { setIsDialogOpen(false); resetForm(); }}
                  className="rounded-xl text-xs h-9 cursor-pointer border-white/20 text-muted-foreground hover:bg-white/10 hover:text-foreground"
                >
                  취소
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-primary-amber hover:opacity-90 text-[#0D0A07] rounded-xl text-xs h-9 font-bold cursor-pointer border-none"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="animate-spin mr-1" size={12} />
                      등록 중...
                    </>
                  ) : "등록"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-3">
          <Loader2 className="animate-spin text-primary-amber" size={32} />
          <p className="text-xs text-muted-foreground font-medium">선반의 원두를 가져오는 중입니다...</p>
        </div>
      ) : loadErrorMessage ? (
        <div className="mx-auto max-w-lg space-y-4 rounded-3xl border border-white/10 bg-white/[0.035] p-7 text-center shadow-sm sm:p-10">
          <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-primary-amber/10 text-primary-amber">
            <AlertCircle size={24} />
          </div>
          <div className="space-y-2">
            <h3 className="break-keep font-serif text-lg font-bold leading-tight text-foreground">보관함을 불러오지 못했습니다</h3>
            <p className="break-keep text-sm text-muted-foreground leading-6">{loadErrorMessage}</p>
          </div>
          <Button
            type="button"
            onClick={fetchShelfData}
            className="min-h-11 rounded-xl border-none bg-primary-amber px-5 text-xs font-bold text-[#0D0A07] shadow-sm hover:opacity-90"
          >
            다시 시도
          </Button>
        </div>
      ) : isAuthRequired ? (
        <div className="mx-auto max-w-lg space-y-4 rounded-3xl border border-primary-amber/18 bg-white/[0.035] p-7 text-center shadow-sm sm:p-10">
          <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-primary-amber/10 text-primary-amber">
            <Coffee size={24} />
          </div>
          <div className="space-y-2">
            <h3 className="break-keep font-serif text-lg font-bold leading-tight text-foreground">로그인이 필요합니다</h3>
            <p className="break-keep text-sm text-muted-foreground leading-6">
              원두 보관함은 CoffeeDex 계정에 저장됩니다. 로그인 후 다시 원두를 등록해 주세요.
            </p>
          </div>
          <Link
            href={buildAuthGateHref("/dashboard")}
            className="inline-flex min-h-11 items-center justify-center rounded-xl bg-primary-amber px-5 text-xs font-bold text-[#0D0A07] shadow-sm transition-opacity hover:opacity-90"
          >
            로그인하고 계속하기
          </Link>
        </div>
      ) : items.length === 0 ? (
        <TiltCard className="mx-auto max-w-lg" glowColor="rgba(212, 175, 55, 0.2)">
          <div className="space-y-5 rounded-[2rem] border border-white/10 bg-black/60 backdrop-blur-xl p-8 text-center shadow-[0_16px_40px_rgba(0,0,0,0.4)] sm:p-12 relative overflow-hidden h-full">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary-amber/10 blur-[60px] pointer-events-none rounded-full" />
            
            <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-amber/20 to-transparent border border-primary-amber/20 text-primary-amber shadow-inner">
              <Coffee size={28} />
            </div>
            <div className="space-y-2 relative z-10">
              <h3 className="break-keep font-serif text-2xl font-bold leading-tight text-foreground">보관함이 비어 있습니다</h3>
              <p className="break-keep text-sm text-muted-foreground leading-relaxed font-light">
                드시고 계시는 스페셜티 원두를 등록해 보세요. 남은 원두 잔량 게이지를 조정하고 데일리 드링킹 다이어리에 기록을 매핑할 수 있습니다.
              </p>
            </div>
            <Button
              onClick={() => setIsDialogOpen(true)}
              className="mt-4 min-h-12 rounded-xl border border-primary-amber/20 bg-primary-amber px-8 text-sm font-bold text-[#0D0A07] shadow-[0_8px_20px_rgba(212,175,55,0.25)] hover:shadow-[0_12px_25px_rgba(212,175,55,0.4)] transition-all hover:-translate-y-0.5 relative z-10"
            >
              첫 원두 등록하기
            </Button>
          </div>
        </TiltCard>
      ) : (
        /* Active Shelf Grid */
        <div className="coffee-shelf-grid mt-4">
          {items.map((item) => (
            <CoffeePackageItem
              key={item.id}
              item={item}
              onUpdateFillLevel={handleUpdateFillLevel}
              onToggleFinished={handleToggleFinished}
              onDelete={handleDeleteItem}
            />
          ))}
        </div>
      )}

      {/* Archived Items Section */}
      {archivedItems.length > 0 && (
        <div className="mt-12 pt-6 border-t border-white/10">
          <Button
            variant="outline"
            onClick={() => setShowArchived(!showArchived)}
            className="text-xs font-bold text-[#F7F7F4]/60 hover:text-[#F7F7F4] border-white/20 hover:bg-white/5 flex items-center gap-1.5 px-3 py-1 cursor-pointer"
          >
            <Archive size={14} />
            다 마신 원두 히스토리 ({archivedItems.length}) {showArchived ? "접기" : "보기"}
          </Button>

          {showArchived && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mt-4 animate-in fade-in duration-300">
              {archivedItems.map((item) => (
                <div
                  key={item.id}
                  className="glass-card p-4 flex justify-between items-center text-xs opacity-75 hover:opacity-100 transition-opacity"
                >
                  <div className="space-y-1">
                    <p className="text-[9px] uppercase font-bold text-primary-amber/70 tracking-wider">
                      {item.roaster_name}
                    </p>
                    <h4 className="font-bold text-foreground font-serif">
                      {item.bean_name}
                    </h4>
                    {item.opened_date && (
                      <p className="text-[10px] text-muted-foreground font-semibold">
                        개봉일: {item.opened_date}
                      </p>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleToggleFinished(item.id, false)}
                      className="rounded-lg h-7 text-[10px] border-white/20 text-muted-foreground hover:bg-white/10 hover:text-foreground px-2 cursor-pointer"
                    >
                      되살리기
                    </Button>
                    <button
                      onClick={(e: React.MouseEvent) => {
                        e.stopPropagation();
                        handleDeleteItem(item.id);
                      }}
                      className="w-7 h-7 text-muted-foreground hover:text-red-400 hover:bg-red-400/10 rounded-lg flex items-center justify-center transition-colors border-none bg-transparent cursor-pointer"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      {/* SmartScanner Modal */}
      {isScannerOpen && (
        <SmartScanner
          onScanComplete={handleScanComplete}
          onQuickSave={handleQuickSave}
          onClose={() => setIsScannerOpen(false)}
        />
      )}
    </div>
  );
}

// Smoke test markers:
// freshShelfStatus.label
// freshShelfStatus.reason
