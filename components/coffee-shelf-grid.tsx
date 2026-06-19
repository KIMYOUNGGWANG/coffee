"use client";

import React, { useState, useEffect } from "react";
import { Coffee, Plus, Trash2, Archive, Loader2, Sparkles, AlertCircle, Calendar, Weight, Scale, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createStarterBrowserClient } from "@/lib/supabase/browser";
import { cn } from "@/lib/utils";
import { motion, useMotionValue, useSpring, useTransform } from "motion/react";

interface TastingCard {
  id: string;
  title: string;
  subtitle: string;
}

// 3D Direction-Aware Tilt Card with Cursor-tracking Glow Effect
function TiltCard({ children, className, onClick }: { children: React.ReactNode; className?: string; onClick?: () => void }) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  // Rotate spring mapping
  const rotateX = useSpring(useTransform(y, [-0.5, 0.5], [8, -8]), { damping: 25, stiffness: 220 });
  const rotateY = useSpring(useTransform(x, [-0.5, 0.5], [-8, 8]), { damping: 25, stiffness: 220 });
  
  // Custom cursor position calculation
  const highlightX = useSpring(useTransform(x, [-0.5, 0.5], [0, 100]), { damping: 25, stiffness: 220 });
  const highlightY = useSpring(useTransform(y, [-0.5, 0.5], [0, 100]), { damping: 25, stiffness: 220 });

  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.matchMedia("(max-width: 768px)").matches || 'ontouchstart' in window);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isMobile) return;
    const el = e.currentTarget;
    const rect = el.getBoundingClientRect();
    const relativeX = (e.clientX - rect.left) / rect.width - 0.5;
    const relativeY = (e.clientY - rect.top) / rect.height - 0.5;

    x.set(relativeX);
    y.set(relativeY);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  const glowBackground = useTransform(
    [highlightX, highlightY],
    ([hx, hy]) => `radial-gradient(circle 120px at ${hx}% ${hy}%, rgba(184, 125, 75, 0.08) 0%, transparent 100%)`
  );

  return (
    <motion.div
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
      style={{
        rotateX: isMobile ? 0 : rotateX,
        rotateY: isMobile ? 0 : rotateY,
        transformStyle: "preserve-3d",
        perspective: 1000,
      }}
      className={cn("relative overflow-hidden group", className)}
    >
      {/* Light glow overlay tracking cursor */}
      {!isMobile && (
        <motion.div
          className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10"
          style={{ background: glowBackground }}
        />
      )}
      <div style={{ transform: "translateZ(20px)", transformStyle: "preserve-3d" }} className="h-full flex flex-col justify-between">
        {children}
      </div>
    </motion.div>
  );
}

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
  tasting_cards?: TastingCard;
}

interface CoffeeShelfGridProps {
  onItemSelect?: (item: ShelfItem) => void;
  refreshTrigger?: number;
}

export default function CoffeeShelfGrid({ onItemSelect, refreshTrigger = 0 }: CoffeeShelfGridProps) {
  const [items, setItems] = useState<ShelfItem[]>([]);
  const [archivedItems, setArchivedItems] = useState<ShelfItem[]>([]);
  const [tastingCards, setTastingCards] = useState<TastingCard[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showArchived, setShowArchived] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Form State
  const [roasterName, setRoasterName] = useState("");
  const [beanName, setBeanName] = useState("");
  const [origin, setOrigin] = useState("");
  const [roastDate, setRoastDate] = useState("");
  const [openedDate, setOpenedDate] = useState("");
  const [totalWeight, setTotalWeight] = useState(200);
  const [tastingCardId, setTastingCardId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize Supabase client
  const [supabase, setSupabase] = useState<any>(null);

  useEffect(() => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
    if (supabaseUrl && supabaseAnonKey) {
      setSupabase(createStarterBrowserClient(supabaseUrl, supabaseAnonKey));
    }
  }, []);

  const fetchShelfData = async () => {
    if (!supabase) return;
    try {
      setIsLoading(true);
      
      // Fetch active items
      const activeResponse = await fetch("/api/v1/shelf?include_finished=false");
      const activeData = await activeResponse.json();
      if (activeData.data) {
        setItems(activeData.data);
      }

      // Fetch archived items
      const archivedResponse = await fetch("/api/v1/shelf?include_finished=true");
      const archivedData = await archivedResponse.json();
      if (archivedData.data) {
        const activeIds = new Set((activeData.data || []).map((i: any) => i.id));
        const strictlyArchived = (archivedData.data || []).filter((i: any) => !activeIds.has(i.id));
        setArchivedItems(strictlyArchived);
      }

      // Fetch user's tasting cards to link
      const cardsResponse = await fetch("/api/v1/cards");
      const cardsData = await cardsResponse.json();
      if (cardsData.data) {
        setTastingCards(cardsData.data);
      }
    } catch (error) {
      console.error("Error fetching shelf data:", error);
      alert("원두 보관함 정보를 불러오지 못했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (supabase) {
      fetchShelfData();
    }
  }, [supabase, refreshTrigger]);

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

      if (!response.ok) throw new Error("Failed to save");

      alert("새 원두를 보관함에 추가했습니다!");
      setIsDialogOpen(false);
      resetForm();
      fetchShelfData();
    } catch (error) {
      console.error("Error creating shelf item:", error);
      alert("원두 등록 중 오류가 발생했습니다.");
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
      console.error("Error updating fill level:", error);
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
      console.error("Error toggling finish state:", error);
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
      console.error("Error deleting item:", error);
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

        {/* Dialog Trigger Button (Custom dialog implementation) */}
        <button
          onClick={() => setIsDialogOpen(true)}
          className="bg-primary-amber hover:opacity-90 text-[#0D0A07] rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 h-10 px-4 py-2 cursor-pointer border-none"
        >
          <Plus size={15} />
          새 원두 등록하기
        </button>
      </div>

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
      ) : items.length === 0 ? (
        <div className="glass-card p-12 text-center max-w-lg mx-auto space-y-4 shadow-sm">
          <div className="w-12 h-12 bg-primary-amber/10 text-primary-amber rounded-full flex items-center justify-center mx-auto">
            <Coffee size={24} />
          </div>
          <div className="space-y-1.5">
            <h3 className="font-serif font-bold text-foreground text-base">보관함이 비어 있습니다</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              드시고 계시는 스페셜티 원두를 등록해 보세요. 남은 원두 잔량 게이지를 조정하고 데일리 드링킹 다이어리에 기록을 매핑할 수 있습니다.
            </p>
          </div>
          <Button
            onClick={() => setIsDialogOpen(true)}
            className="bg-primary-amber hover:opacity-90 text-[#0D0A07] rounded-xl text-xs font-bold shadow-sm border-none"
          >
            첫 원두 등록하기
          </Button>
        </div>
      ) : (
        /* Active Shelf Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-12 mt-4 relative">
          {items.map((item) => (
            <div key={item.id} className="relative group cursor-pointer" onClick={() => onItemSelect?.(item)}>
              {/* Physical Shelf Shadow/Line beneath the card */}
              <div className="absolute -bottom-4 left-[-5%] w-[110%] h-6 bg-black/40 blur-md rounded-full -z-10 group-hover:h-8 transition-all duration-300 opacity-60" />
              <div className="absolute -bottom-1 left-[-2%] w-[104%] h-3 bg-gradient-to-b from-[#3E3124] to-[#1a140f] rounded-t-sm shadow-xl -z-10" />

              <TiltCard
                className="glass-card rounded-t-3xl rounded-b-md p-6 group-hover:-translate-y-2 transition-transform duration-300 relative overflow-hidden"
              >
                {/* Dynamic Top Accent */}
                <div className={`absolute top-0 left-0 w-full h-2 transition-colors duration-300 ${getRoastColorClasses(item.roaster_name, item.bean_name, item.origin)}`} />

                <div className="space-y-4 pt-1">
                  {/* Roaster & Buttons */}
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-primary-amber tracking-wider bg-primary-amber/10 px-2 py-0.5 rounded-full">
                        {item.roaster_name}
                      </span>
                      <h3 className="font-serif font-extrabold text-foreground text-lg mt-2 leading-tight">
                        {item.bean_name}
                      </h3>
                    </div>
                    <div className="flex gap-1 z-20">
                      <button
                        onClick={(e: React.MouseEvent) => {
                          e.stopPropagation();
                          handleToggleFinished(item.id, true);
                        }}
                        title="다 마쉼 (아카이브)"
                        className="w-7 h-7 text-muted-foreground hover:text-green-400 hover:bg-green-400/10 rounded-lg flex items-center justify-center transition-colors border-none bg-transparent cursor-pointer"
                      >
                        <Archive size={14} />
                      </button>
                      <button
                        onClick={(e: React.MouseEvent) => {
                          e.stopPropagation();
                          handleDeleteItem(item.id);
                        }}
                        title="삭제"
                        className="w-7 h-7 text-muted-foreground hover:text-red-400 hover:bg-red-400/10 rounded-lg flex items-center justify-center transition-colors border-none bg-transparent cursor-pointer"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  {/* Subtitle / Description */}
                  {item.origin && (
                    <p className="text-xs text-muted-foreground font-semibold line-clamp-1 border-l-2 border-primary-amber/30 pl-2">
                      {item.origin}
                    </p>
                  )}

                  {/* Dates / Meta */}
                  <div className="grid grid-cols-2 gap-2 text-[10px] text-foreground font-semibold bg-white/5 p-3 rounded-xl border border-white/5 shadow-inner mt-2">
                    <div className="flex items-center gap-1.5">
                      <Calendar size={11} className="text-primary-amber" />
                      <span>로스팅: {item.roast_date ? item.roast_date : "미기재"}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Calendar size={11} className="text-primary-amber" />
                      <span>개봉: {item.opened_date ? item.opened_date : "미기재"}</span>
                    </div>
                  </div>
                </div>

                {/* Fill Level Control Area */}
                <div className="mt-6 pt-5 border-t border-white/10 space-y-3">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-extrabold text-foreground flex items-center gap-1.5">
                      <Scale size={13} className="text-primary-amber" />
                      남은 잔량: {item.fill_level}%
                    </span>
                    <span className="text-[10px] text-muted-foreground font-bold bg-white/5 px-2 py-0.5 rounded-full">
                      총 {item.total_weight}g
                    </span>
                  </div>

                  {/* Custom Fill level indicator with quick action buttons */}
                  <div className="w-full bg-black/40 h-2.5 rounded-full overflow-hidden shadow-inner">
                    <div
                      className={cn("h-full transition-all duration-300", getFillLevelColor(item.fill_level))}
                      style={{ width: `${item.fill_level}%` }}
                    />
                  </div>

                  {/* Quick actions for fill level */}
                  <div className="flex justify-between gap-1.5 pt-1.5 relative z-20">
                    {[100, 75, 50, 25, 0].map((level) => (
                      <button
                        key={level}
                        onClick={(e: React.MouseEvent) => {
                          e.stopPropagation();
                          if (level === 0) {
                            handleToggleFinished(item.id, true);
                          } else {
                            handleUpdateFillLevel(item.id, level);
                          }
                        }}
                        className={cn(
                          "text-[9px] font-extrabold px-1.5 py-1 rounded-lg border transition-all cursor-pointer flex-1 text-center shadow-sm active:scale-95",
                          item.fill_level === level
                            ? "bg-primary-amber text-[#0D0A07] border-primary-amber"
                            : "bg-white/5 text-muted-foreground border-white/10 hover:bg-white/10 hover:text-foreground"
                        )}
                      >
                        {level === 0 ? "Empty" : `${level}%`}
                      </button>
                    ))}
                  </div>
                </div>
              </TiltCard>
            </div>
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
    </div>
  );
}
