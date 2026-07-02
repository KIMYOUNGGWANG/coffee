"use client";

import React, { useState, useEffect } from "react";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Plus, Star, Coffee, Loader2, Clock, Thermometer, Droplet, Layers, X, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { trackAnalyticsEvent } from "@/lib/analytics-client";
import { calculateShelfConsumption } from "@/lib/shelf-consumption";
import { cn } from "@/lib/utils";

interface ShelfItem {
  id: string;
  roaster_name: string;
  bean_name: string;
  total_weight: number;
  fill_level: number;
  is_finished: boolean;
}

interface BrewingLog {
  id: string;
  shelf_item_id: string | null;
  brewed_at: string;
  method: string;
  parameters: {
    waterTemp?: number | null;
    waterAmount?: number | null;
    coffeeAmount?: number | null;
    grindSize?: string | null;
    brewTime?: string | null;
  };
  rating: number | null;
  simple_note: string | null;
  coffee_shelf_items?: ShelfItem;
}

interface DailyBrewingCalendarProps {
  refreshTrigger?: number;
  onLogAdded?: () => void;
}

export default function DailyBrewingCalendar({ refreshTrigger = 0, onLogAdded }: DailyBrewingCalendarProps) {
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [logs, setLogs] = useState<BrewingLog[]>([]);
  const [activeShelfItems, setActiveShelfItems] = useState<ShelfItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Dialog/Modal States
  const [isLogDialogOpen, setIsLogDialogOpen] = useState(false);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedDayLogs, setSelectedDayLogs] = useState<BrewingLog[]>([]);

  // Form State
  const [shelfItemId, setShelfItemId] = useState("");
  const [method, setMethod] = useState("Drip");
  const [waterTemp, setWaterTemp] = useState("");
  const [waterAmount, setWaterAmount] = useState("");
  const [coffeeAmount, setCoffeeAmount] = useState("");
  const [grindSize, setGrindSize] = useState("");
  const [brewTime, setBrewTime] = useState("");
  const [rating, setRating] = useState<number>(5);
  const [simpleNote, setSimpleNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchLogsAndShelf = async () => {
    try {
      setIsLoading(true);
      const shelfRes = await fetch("/api/v1/shelf?include_finished=false");
      const shelfData = await shelfRes.json();
      if (shelfData.data) {
        setActiveShelfItems(shelfData.data);
      }

      const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).toISOString();
      const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0, 23, 59, 59).toISOString();
      
      const logsRes = await fetch(`/api/v1/brewing-logs?start_date=${startOfMonth}&end_date=${endOfMonth}`);
      const logsData = await logsRes.json();
      if (logsData.data) {
        setLogs(logsData.data);
      }
    } catch (error) {
      console.error("Error loading calendar data:", error);
      alert("드링킹 다이어리 기록을 가져오지 못했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogsAndShelf();
  }, [currentDate, refreshTrigger]);

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const days = new Date(year, month + 1, 0).getDate();
    const firstDayIndex = new Date(year, month, 1).getDay();
    return { days, firstDayIndex };
  };

  const { days, firstDayIndex } = getDaysInMonth(currentDate);

  const getLogsForDay = (day: number) => {
    return logs.filter(log => {
      const logDate = new Date(log.brewed_at);
      return (
        logDate.getDate() === day &&
        logDate.getMonth() === currentDate.getMonth() &&
        logDate.getFullYear() === currentDate.getFullYear()
      );
    });
  };

  const handleDayClick = (day: number) => {
    const clickedDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    const dayLogs = getLogsForDay(day);
    
    setSelectedDate(clickedDate);
    setSelectedDayLogs(dayLogs);

    if (dayLogs.length > 0) {
      setIsDetailDialogOpen(true);
    } else {
      resetForm();
      if (activeShelfItems.length > 0) {
        setShelfItemId(activeShelfItems[0].id);
      }
      setIsLogDialogOpen(true);
    }
  };

  const handleCreateLog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDate) return;

    try {
      setIsSubmitting(true);
      const payload = {
        shelfItemId: shelfItemId || null,
        brewedAt: new Date(
          selectedDate.getFullYear(),
          selectedDate.getMonth(),
          selectedDate.getDate(),
          new Date().getHours(),
          new Date().getMinutes()
        ).toISOString(),
        method,
        parameters: {
          waterTemp: waterTemp ? Number(waterTemp) : null,
          waterAmount: waterAmount ? Number(waterAmount) : null,
          coffeeAmount: coffeeAmount ? Number(coffeeAmount) : null,
          grindSize: grindSize || null,
          brewTime: brewTime || null,
        },
        rating,
        simpleNote: simpleNote || null,
      };

      const response = await fetch("/api/v1/brewing-logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error("Failed to save log");

      alert("오늘의 커피 추출 로그를 기록했습니다!");
      setIsLogDialogOpen(false);
      resetForm();
      fetchLogsAndShelf();
      onLogAdded?.();
    } catch (error) {
      trackAnalyticsEvent("brewing_log_save_failed", { surface: "daily_calendar" });
      console.error("Error creating brewing log:", error);
      alert("추출 로그 저장 중 오류가 발생했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteLog = async (logId: string) => {
    if (!confirm("이 추출 로그를 정말 삭제하시겠습니까?")) return;
    try {
      const response = await fetch(`/api/v1/brewing-logs/${logId}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete log");

      alert("추출 로그를 삭제했습니다.");
      setIsDetailDialogOpen(false);
      fetchLogsAndShelf();
      onLogAdded?.();
    } catch (error) {
      console.error("Error deleting log:", error);
      alert("추출 로그 삭제 중 오류가 발생했습니다.");
    }
  };

  const resetForm = () => {
    setShelfItemId("");
    setMethod("Drip");
    setWaterTemp("");
    setWaterAmount("");
    setCoffeeAmount("");
    setGrindSize("");
    setBrewTime("");
    setRating(5);
    setSimpleNote("");
  };

  const renderCalendarCells = () => {
    const cells = [];
    const totalSlots = Math.ceil((days + firstDayIndex) / 7) * 7;

    for (let i = 0; i < totalSlots; i++) {
      const dayNumber = i - firstDayIndex + 1;
      const isCurrentMonthDay = dayNumber > 0 && dayNumber <= days;
      const dayLogs = isCurrentMonthDay ? getLogsForDay(dayNumber) : [];
      const hasLogs = dayLogs.length > 0;

      const today = new Date();
      const isToday =
        isCurrentMonthDay &&
        dayNumber === today.getDate() &&
        currentDate.getMonth() === today.getMonth() &&
        currentDate.getFullYear() === today.getFullYear();

      cells.push(
        <div
          key={i}
          onClick={() => isCurrentMonthDay && handleDayClick(dayNumber)}
          className={cn(
            "min-h-[3.75rem] border-b border-r border-white/10 p-1.5 transition-colors sm:min-h-[5rem] sm:p-2",
            isCurrentMonthDay
              ? "flex cursor-pointer flex-col items-start justify-between bg-[#17120e] hover:bg-[#211a14]"
              : "bg-[#0f0b08] text-muted-foreground/18",
            isToday && "bg-primary-amber/10 shadow-[inset_0_0_0_1px_rgba(217,160,91,0.55)]"
          )}
        >
          {isCurrentMonthDay ? (
            <>
              <span className={cn(
                "text-xs font-bold font-mono leading-none",
                isToday ? "text-primary-amber" : "text-muted-foreground"
              )}>
                {dayNumber}
              </span>

              {hasLogs && (
                <div className="flex w-full flex-wrap justify-center gap-1 pb-1">
                  {dayLogs.map((log) => (
                    <div
                      key={log.id}
                      title={`${log.coffee_shelf_items?.bean_name || "원두"} (${log.method})`}
                      className="flex size-5 items-center justify-center rounded-full bg-primary-amber text-[#0D0A07] shadow-sm transition-transform hover:scale-110 md:size-6"
                    >
                      <Coffee size={10} className="md:scale-110" />
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : null}
        </div>
      );
    }
    return cells;
  };

  const monthNames = ["1월", "2월", "3월", "4월", "5월", "6월", "7월", "8월", "9월", "10월", "11월", "12월"];
  const selectedShelfItem = activeShelfItems.find((item) => item.id === shelfItemId) ?? null;
  const shelfConsumptionPreview = selectedShelfItem
    ? calculateShelfConsumption({
      totalWeight: selectedShelfItem.total_weight,
      fillLevel: selectedShelfItem.fill_level,
      coffeeAmount: coffeeAmount ? Number(coffeeAmount) : null,
    })
    : null;

  return (
    <div className="space-y-6">
      {/* Header with navigation */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-border pb-4">
        <div>
          <h2 className="text-xl font-bold font-serif text-foreground flex items-center gap-2">
            <CalendarIcon className="text-primary-amber" size={20} />
            데일리 드링킹 다이어리 (Brewing Diary)
          </h2>
          <p className="text-xs text-muted-foreground mt-1">
            캘린더를 통해 하루 동안 마신 스페셜티 커피의 기록을 수집하고, 바리스타 스탬프를 가꿔보세요.
          </p>
        </div>

        {/* Date Selector */}
        <div className="flex items-center gap-2 bg-black/20 border border-white/10 px-3 py-1.5 rounded-xl shadow-sm self-stretch sm:self-auto justify-between">
          <button
            onClick={handlePrevMonth}
            className="w-8 h-8 rounded-lg hover:bg-white/10 flex items-center justify-center border-none bg-transparent cursor-pointer text-muted-foreground hover:text-foreground"
          >
            <ChevronLeft size={16} />
          </button>
          <span className="text-xs font-bold font-serif text-foreground px-4 min-w-[80px] text-center">
            {currentDate.getFullYear()}년 {monthNames[currentDate.getMonth()]}
          </span>
          <button
            onClick={handleNextMonth}
            className="w-8 h-8 rounded-lg hover:bg-white/10 flex items-center justify-center border-none bg-transparent cursor-pointer text-muted-foreground hover:text-foreground"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-24 space-y-3 glass-card rounded-3xl">
          <Loader2 className="animate-spin text-primary-amber" size={32} />
          <p className="text-xs text-muted-foreground font-medium">드링킹 캘린더를 로드하는 중입니다...</p>
        </div>
      ) : (
        /* Calendar Grid */
        <div className="overflow-hidden rounded-3xl border border-white/10 bg-[#0d0a07] shadow-[0_18px_50px_rgba(0,0,0,0.28)]">
          {/* Days of Week Header */}
          <div className="grid grid-cols-7 border-b border-white/10 bg-[#17120e] py-2.5 text-center text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            {["일", "월", "화", "수", "목", "금", "토"].map((dayName, idx) => (
              <div
                key={idx}
                className={cn(
                  idx === 0 && "text-red-400",
                  idx === 6 && "text-muted-foreground"
                )}
              >
                {dayName}
              </div>
            ))}
          </div>

          {/* Calendar Day Grid Cells */}
          <div className="grid grid-cols-7">
            {renderCalendarCells()}
          </div>
        </div>
      )}

      {/* dialog for CREATING brewing log */}
      {isLogDialogOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-card max-w-md w-full p-6 shadow-2xl space-y-4 relative animate-in fade-in zoom-in-95 duration-200">
            <button
              onClick={() => setIsLogDialogOpen(false)}
              className="absolute top-4 right-4 p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-white/10 transition-colors border-none bg-transparent cursor-pointer"
            >
              <X size={18} />
            </button>

            <div className="space-y-1">
              <h3 className="font-serif font-bold text-foreground text-lg">
                {selectedDate && `${selectedDate.getMonth() + 1}월 ${selectedDate.getDate()}일`} 브루잉 기록
              </h3>
              <p className="text-[11px] text-muted-foreground">선택한 날짜에 추출한 커피 레시피와 노트를 저장합니다.</p>
            </div>

            <form onSubmit={handleCreateLog} className="space-y-4 pt-2">
              <div className="space-y-1">
                <label htmlFor="bean-select" className="text-xs font-bold text-foreground">사용 원두 *</label>
                {activeShelfItems.length > 0 ? (
                  <select
                    id="bean-select"
                    className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary-amber/20 focus:border-primary-amber"
                    value={shelfItemId}
                    onChange={(e) => setShelfItemId(e.target.value)}
                    required
                  >
                    {activeShelfItems.map(item => (
                      <option key={item.id} value={item.id}>
                        [{item.roaster_name}] {item.bean_name}
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="text-xs text-red-400 border border-red-500/20 bg-red-500/10 p-2 rounded-lg font-semibold">
                    보관함에 등록된 활성 원두가 없습니다. 원두를 먼저 등록해 주세요!
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label htmlFor="brew-method" className="text-xs font-semibold text-muted-foreground">추출 방식 *</label>
                  <select
                    id="brew-method"
                    className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary-amber/20 focus:border-primary-amber"
                    value={method}
                    onChange={(e) => setMethod(e.target.value)}
                  >
                    {["Drip", "Espresso", "AeroPress", "FrenchPress", "ColdBrew", "Other"].map(m => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>
                
                <div className="space-y-1">
                  <span className="text-xs font-semibold text-muted-foreground block">별점 (만족도)</span>
                  <div className="flex gap-1 items-center h-9">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        className="text-primary-amber hover:scale-110 transition-transform border-none bg-transparent cursor-pointer"
                      >
                        <Star size={18} fill={rating >= star ? "#d9a05b" : "none"} strokeWidth={1.5} />
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Brewing Parameters Grid */}
              <div className="bg-white/5 p-3.5 rounded-xl border border-white/10 space-y-3">
                <h4 className="text-[10px] uppercase font-bold text-primary-amber tracking-wider flex items-center gap-1">
                  <Clock size={12} />
                  세부 추출 파라미터 (선택)
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label htmlFor="temp" className="text-[10px] text-muted-foreground font-medium flex items-center gap-1">
                      <Thermometer size={11} /> 물 온도 (°C)
                    </label>
                    <input
                      id="temp"
                      type="number"
                      placeholder="예: 92"
                      value={waterTemp}
                      onChange={e => setWaterTemp(e.target.value)}
                      className="w-full bg-black/20 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary-amber/20 focus:border-primary-amber placeholder:text-muted-foreground/30"
                    />
                  </div>
                  <div className="space-y-1">
                    <label htmlFor="water" className="text-[10px] text-muted-foreground font-medium flex items-center gap-1">
                      <Droplet size={11} /> 추출 양 (g / ml)
                    </label>
                    <input
                      id="water"
                      type="number"
                      placeholder="예: 300"
                      value={waterAmount}
                      onChange={e => setWaterAmount(e.target.value)}
                      className="w-full bg-black/20 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary-amber/20 focus:border-primary-amber placeholder:text-muted-foreground/30"
                    />
                  </div>
                  <div className="space-y-1">
                    <label htmlFor="coffee-weight" className="text-[10px] text-muted-foreground font-medium flex items-center gap-1">
                      <Layers size={11} /> 원두 무게 (g)
                    </label>
                    <input
                      id="coffee-weight"
                      type="number"
                      placeholder="예: 20"
                      value={coffeeAmount}
                      onChange={e => setCoffeeAmount(e.target.value)}
                      className="w-full bg-black/20 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary-amber/20 focus:border-primary-amber placeholder:text-muted-foreground/30"
                    />
                  </div>
                  <div className="space-y-1">
                    <label htmlFor="grind" className="text-[10px] text-muted-foreground font-medium flex items-center gap-1">
                      🎚️ 분쇄도 (Grind)
                    </label>
                    <input
                      id="grind"
                      placeholder="예: Medium"
                      value={grindSize}
                      onChange={e => setGrindSize(e.target.value)}
                      className="w-full bg-black/20 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary-amber/20 focus:border-primary-amber placeholder:text-muted-foreground/30"
                    />
                  </div>
                </div>
                {shelfConsumptionPreview && selectedShelfItem && (
                  <div className="rounded-xl border border-primary-amber/20 bg-primary-amber/10 px-3 py-2 text-[11px] font-bold leading-5 text-[#FFF8EC]/72">
                    저장하면 {selectedShelfItem.bean_name} 선반 잔량이 {shelfConsumptionPreview.previousFillLevel}%에서{" "}
                    <span className="text-primary-amber">{shelfConsumptionPreview.nextFillLevel}%</span>로 자동 반영됩니다.
                  </div>
                )}
              </div>

              <div className="space-y-1">
                <label htmlFor="note" className="text-xs font-semibold text-muted-foreground">한 줄 감상 메모</label>
                <input
                  id="note"
                  placeholder="예: 화사한 자스민 아로마, 깔끔한 후미가 돋보였습니다."
                  value={simpleNote}
                  onChange={e => setSimpleNote(e.target.value)}
                  className="w-full bg-black/20 border border-white/10 rounded-xl px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary-amber/20 focus:border-primary-amber placeholder:text-muted-foreground/30"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-white/10">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsLogDialogOpen(false)}
                  className="rounded-xl text-xs h-9 cursor-pointer border-white/20 text-muted-foreground hover:bg-white/10 hover:text-foreground"
                >
                  취소
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting || activeShelfItems.length === 0}
                  className="bg-primary-amber hover:opacity-90 text-[#0D0A07] rounded-xl text-xs h-9 font-bold cursor-pointer border-none"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="animate-spin mr-1" size={12} />
                      기록 중...
                    </>
                  ) : "저장"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* dialog for viewing DETAIL and DELETING brewing log */}
      {isDetailDialogOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-card max-w-md w-full p-6 shadow-2xl space-y-4 relative animate-in fade-in zoom-in-95 duration-200">
            <button
              onClick={() => setIsDetailDialogOpen(false)}
              className="absolute top-4 right-4 p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-white/10 transition-colors border-none bg-transparent cursor-pointer"
            >
              <X size={18} />
            </button>

            <div className="space-y-1">
              <h3 className="font-serif font-bold text-foreground text-lg">
                {selectedDate && `${selectedDate.getMonth() + 1}월 ${selectedDate.getDate()}일`} 커피 로그
              </h3>
              <p className="text-[11px] text-muted-foreground">선택한 날짜에 기록된 추출 정보 목록입니다.</p>
            </div>
            
            <div className="space-y-4 py-2 max-h-[300px] overflow-y-auto scrollbar-none">
              {selectedDayLogs.map((log) => (
                <div key={log.id} className="border border-white/10 rounded-xl p-4 bg-white/5 space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      {log.coffee_shelf_items && (
                        <p className="text-[10px] uppercase font-bold text-primary-amber tracking-wider">
                          {log.coffee_shelf_items.roaster_name}
                        </p>
                      )}
                      <h4 className="font-bold text-foreground font-serif text-sm">
                        {log.coffee_shelf_items ? log.coffee_shelf_items.bean_name : "삭제된 원두"}
                      </h4>
                    </div>
                    <span className="text-[10px] bg-primary-amber text-[#0D0A07] font-bold px-2 py-0.5 rounded-full">
                      {log.method}
                    </span>
                  </div>

                  {log.rating && (
                     <div className="flex gap-0.5 items-center">
                      {Array.from({ length: 5 }).map((_, idx) => (
                        <Star
                          key={idx}
                          size={12}
                          className="text-primary-amber"
                          fill={log.rating! > idx ? "#d9a05b" : "none"}
                        />
                      ))}
                    </div>
                  )}

                  <div className="grid grid-cols-3 gap-2 text-[10px] text-foreground bg-black/20 p-2 rounded-lg border border-white/5 font-mono">
                    <div className="flex items-center gap-1">
                      <Thermometer size={10} className="text-primary-amber" />
                      <span>온도: {log.parameters?.waterTemp ? `${log.parameters.waterTemp}°C` : "-"}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Droplet size={10} className="text-primary-amber" />
                      <span>추출: {log.parameters?.waterAmount ? `${log.parameters.waterAmount}g` : "-"}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Layers size={10} className="text-primary-amber" />
                      <span>원두: {log.parameters?.coffeeAmount ? `${log.parameters.coffeeAmount}g` : "-"}</span>
                    </div>
                  </div>

                  {log.simple_note && (
                    <p className="text-xs text-muted-foreground leading-relaxed italic border-l-2 border-primary-amber/30 pl-2">
                      "{log.simple_note}"
                    </p>
                  )}

                  <div className="flex justify-end pt-2">
                    <button
                      onClick={() => handleDeleteLog(log.id)}
                      className="text-muted-foreground hover:text-red-400 hover:bg-red-500/10 rounded-lg h-8 px-2 text-[11px] font-bold flex items-center gap-1 transition-colors border-none bg-transparent cursor-pointer"
                    >
                      <Trash2 size={12} />
                      로그 삭제
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t border-white/10">
              <Button
                variant="outline"
                onClick={() => setIsDetailDialogOpen(false)}
                className="rounded-xl text-xs h-9 cursor-pointer border-white/20 text-muted-foreground hover:bg-white/10 hover:text-foreground"
              >
                닫기
              </Button>
              <Button
                onClick={() => {
                  setIsDetailDialogOpen(false);
                  resetForm();
                  if (activeShelfItems.length > 0) {
                    setShelfItemId(activeShelfItems[0].id);
                  }
                  setIsLogDialogOpen(true);
                }}
                className="bg-primary-amber hover:opacity-90 text-[#0D0A07] rounded-xl text-xs h-9 font-bold cursor-pointer border-none"
              >
                추가 추출 기록하기
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
