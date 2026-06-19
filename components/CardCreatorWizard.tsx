"use client";

import React from "react";
import { X, ArrowRight, ArrowLeft, Coffee, Sparkles, Loader2, Image as ImageIcon, AlertCircle, CheckCircle } from "lucide-react";
import { useTastingStore } from "@/stores/tastingStore";
import { useCreateTastingCard, useGenerateAiNote, useUserProfile, useScanCoffeePackage } from "@/hooks/useTastingCards";
import { tasteProfilePresetByKey, type TasteProfileKey } from "@/lib/taste-profile";
import TastingCard from "./TastingCard";
import PaymentDialog from "./PaymentDialog";

// Mock preset tags to make picking flavor notes easier
const PRESET_TAGS = [
  { category: "과일 (Fruit)", items: ["Citrus", "Lemon", "Orange", "Berry", "Cherry", "Apple", "Grape", "Peach"] },
  { category: "달콤 (Sweet)", items: ["Honey", "Caramel", "Chocolate", "Cacao", "Vanilla", "Brown Sugar"] },
  { category: "고소 & 기타 (Nutty & Herbs)", items: ["Almond", "Hazelnut", "Peanut", "Floral", "Jasmine", "Mint", "Herb", "Woody", "Earthy"] },
];

const COFFEE_METHODS = ["Hario V60", "Kalita Wave", "Espresso", "AeroPress", "French Press", "Moka Pot", "Cold Brew"];
const ROASTING_POINTS = ["Light", "Medium", "Dark"];

interface CardCreatorWizardProps {
  isOpen: boolean;
  onClose: () => void;
  initialTasteProfile?: TasteProfileKey | null;
}

function getErrorMessage(error: unknown, fallbackMessage: string): string {
  if (error instanceof Error) {
    const message = error.message.trim();
    if (message.length > 0) return message;
  }
  return fallbackMessage;
}

export default function CardCreatorWizard({ isOpen, onClose, initialTasteProfile = null }: CardCreatorWizardProps) {
  const {
    step,
    form,
    isGeneratingAiNote,
    setStep,
    nextStep,
    prevStep,
    updateForm,
    resetForm,
    setIsGeneratingAiNote,
    addTag,
    removeTag,
    addBadge,
    removeBadge,
  } = useTastingStore();

  const createCardMutation = useCreateTastingCard();
  const generateAiNoteMutation = useGenerateAiNote();
  const scanCoffeePackageMutation = useScanCoffeePackage();

  const [isPaymentOpen, setIsPaymentOpen] = React.useState(false);
  const [isScanning, setIsScanning] = React.useState(false);
  const [scanError, setScanError] = React.useState<string | null>(null);
  const [scanSuccessMessage, setScanSuccessMessage] = React.useState<string | null>(null);
  const [aiNoteError, setAiNoteError] = React.useState<string | null>(null);
  const [submitError, setSubmitError] = React.useState<string | null>(null);
  const appliedTasteProfileRef = React.useRef<TasteProfileKey | null>(null);
  const { data: profile } = useUserProfile();
  const initialTasteProfilePreset = initialTasteProfile ? tasteProfilePresetByKey[initialTasteProfile] : null;

  const [loadingMessageIdx, setLoadingMessageIdx] = React.useState(0);
  const loadingMessages = [
    "원두 향미 프로파일 수집 중...",
    "SCA 플레이버 휠 매칭 중...",
    "나만의 감성 컵노트 요약 작성 중...",
    "바리스타 감성 한줄평 다듬는 중..."
  ];

  React.useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isGeneratingAiNote) {
      interval = setInterval(() => {
        setLoadingMessageIdx((prev) => (prev + 1) % loadingMessages.length);
      }, 1400);
    } else {
      setLoadingMessageIdx(0);
    }
    return () => clearInterval(interval);
  }, [isGeneratingAiNote]);

  React.useEffect(() => {
    if (!isOpen || !initialTasteProfilePreset || appliedTasteProfileRef.current === initialTasteProfilePreset.key) {
      return;
    }

    updateForm({
      metric1: initialTasteProfilePreset.formDefaults.metric1,
      metric2: initialTasteProfilePreset.formDefaults.metric2,
      metric3: initialTasteProfilePreset.formDefaults.metric3,
      tags: [...initialTasteProfilePreset.formDefaults.tags],
      rawNote: initialTasteProfilePreset.formDefaults.rawNote,
    });
    appliedTasteProfileRef.current = initialTasteProfilePreset.key;
  }, [initialTasteProfilePreset, isOpen, updateForm]);

  React.useEffect(() => {
    if (isOpen) return;
    appliedTasteProfileRef.current = null;
  }, [isOpen]);

  if (!isOpen) return null;

  const clearWizardMessages = () => {
    setScanError(null);
    setScanSuccessMessage(null);
    setAiNoteError(null);
    setSubmitError(null);
  };

  const getScanAllowanceLabel = () => {
    if (!profile) return "무료 스캔 상태 확인 중";
    if (profile.is_premium) return "Premium 플랜: 월간 한도 없이 스캔 가능";

    const remainingFreeScans = Math.max(0, profile.monthly_scan_limit - profile.scans_used);
    if (remainingFreeScans > 0) {
      return `이번 달 남은 무료 스캔: ${remainingFreeScans}회 / ${profile.monthly_scan_limit}회`;
    }

    if (profile.credits > 0) {
      return `무료 스캔 소진, 보유 크레딧 ${profile.credits}개 사용 가능`;
    }

    return "무료 스캔 소진, 충전 필요";
  };

  const getCompactScanAllowanceLabel = () => {
    if (!profile) return "5회 남음";
    if (profile.is_premium) return "Premium (한도 없음)";

    const remainingFreeScans = Math.max(0, profile.monthly_scan_limit - profile.scans_used);
    if (remainingFreeScans > 0) return `${remainingFreeScans}회 남음`;
    if (profile.credits > 0) return `크레딧 ${profile.credits}개`;
    return "충전 필요";
  };

  // Handle package image scanning/OCR via AI
  const handleFileScan = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const fileInput = event.currentTarget;
    const file = fileInput.files?.[0];
    fileInput.value = "";
    if (!file) return;

    setScanError(null);
    setScanSuccessMessage(null);
    const hasNoAvailableScan =
      !profile?.is_premium &&
      profile &&
      profile.scans_used >= profile.monthly_scan_limit &&
      profile.credits <= 0;

    if (hasNoAvailableScan) {
      setScanError("월간 무료 AI 스캔 한도와 보유 크레딧을 모두 사용했습니다. 크레딧을 충전하거나 프리미엄으로 업그레이드해주세요.");
      setIsPaymentOpen(true);
      return;
    }

    setIsScanning(true);
    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        if (typeof reader.result !== "string") {
          setScanError("이미지 파일을 읽지 못했습니다. 다른 사진으로 다시 시도해주세요.");
          setIsScanning(false);
          return;
        }

        const base64String = reader.result;
        try {
          const scanResponse = await scanCoffeePackageMutation.mutateAsync({ image: base64String });
          const data = scanResponse.data;
          const isFallbackScan = "source" in data && data.source === "fallback_mock";
          const confidencePercent = "confidence" in data && typeof data.confidence === "number" ? Math.round(data.confidence * 100) : null;
          const scanLabel = isFallbackScan ? "내장 샘플 분석(실제 AI 판독 아님)" : "AI 판독";

          updateForm({
            title: data.title || "",
            subtitle: data.subtitle || "",
            origin: data.origin || "",
            extraInfo: data.process || "",
            tags: data.tags || [],
            metric1: data.metric1_acidity || 3,
            metric2: data.metric2_sweetness || 3,
            metric3: data.metric3_body || 3,
          });

          setScanError(null);
          setScanSuccessMessage(`${scanLabel} 초안입니다${confidencePercent ? ` (신뢰도 ${confidencePercent}%)` : ""}. 저장 전 자동 입력값을 확인하고 수정해주세요.`);
        } catch (error) {
          setScanError(getErrorMessage(error, "원두 패키지 판독에 실패했습니다. 사진을 확인하고 다시 시도해주세요."));
        } finally {
          setIsScanning(false);
        }
      };
      reader.onerror = () => {
        setScanError("이미지 파일을 읽지 못했습니다. 다른 사진으로 다시 시도해주세요.");
        setIsScanning(false);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      setScanError(getErrorMessage(error, "이미지 파일을 처리하지 못했습니다. 다른 사진으로 다시 시도해주세요."));
      setIsScanning(false);
    }
  };

  // Handle live AI generation of SCA cup note
  const handleGenerateAiNote = async () => {
    setAiNoteError(null);
    setSubmitError(null);
    setIsGeneratingAiNote(true);
    try {
      const response = await generateAiNoteMutation.mutateAsync({
        tags: form.tags,
        rawNote: form.rawNote,
      });
      updateForm({ aiDescription: response.aiDescription });
      nextStep(); // Advance to final step showing preview
    } catch (error) {
      setAiNoteError(getErrorMessage(error, "AI 컵노트 생성에 실패했습니다. 잠시 후 다시 시도해주세요."));
    } finally {
      setIsGeneratingAiNote(false);
    }
  };

  // Handle final submission to database
  const handleSubmit = async () => {
    setSubmitError(null);
    try {
      const badgesArray = [
        form.category === "coffee" ? "Single Origin" : "Craft Beer",
        form.extraInfo || "Hario V60",
      ];
      if (form.badges.length > 0) {
        badgesArray.push(...form.badges);
      }

      await createCardMutation.mutateAsync({
        category: form.category,
        title: form.title || "이름 없는 커피",
        subtitle: form.subtitle || "홈카페",
        imageUrl: form.imageUrl,
        badges: badgesArray,
        metric1: form.metric1,
        metric2: form.metric2,
        metric3: form.metric3,
        tags: form.tags,
        aiDescription: form.aiDescription || "무난하고 균형 잡힌 데일리 커피.",
        footerMeta: {
          origin: form.origin || "Unknown",
          date: form.date,
          extraInfo: form.extraInfo ? `${form.extraInfo}, 92°C` : "92°C",
        },
      });

      clearWizardMessages();
      resetForm();
      onClose();
    } catch (error) {
      setSubmitError(getErrorMessage(error, "카드 저장에 실패했습니다. 잠시 후 다시 시도해주세요."));
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="glass-card border border-white/10 rounded-3xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col md:flex-row h-[90vh] md:h-[620px] animate-in fade-in zoom-in-95 duration-200">

        {/* Left pane: Stepper tracker & inputs */}
        <div className="flex-1 p-6 md:p-8 flex flex-col justify-between overflow-y-auto border-r border-white/10">

          {/* Header */}
          <div className="flex justify-between items-center pb-4 border-b border-white/10">
            <div>
              <h2 className="text-xl font-bold font-serif text-foreground">새로운 테이스팅 카드</h2>
              <p className="text-xs text-muted-foreground mt-0.5">내 커피 기록을 예쁜 카드로 아카이빙합니다.</p>
            </div>
            <button
              onClick={() => { clearWizardMessages(); resetForm(); onClose(); }}
              className="p-1.5 rounded-full hover:bg-white/10 text-muted-foreground transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          {/* Step content */}
          <div className="flex-1 py-6">

            {/* STEP 1: Basic Metadata */}
            {step === 1 && (
              <div className="space-y-4 animate-in slide-in-from-right-5 duration-200">
                <h3 className="font-serif font-bold text-foreground text-base mb-2">1단계: 원두 및 추출 정보</h3>

                {initialTasteProfilePreset && (
                  <div
                    data-testid="taste-profile-prefill"
                    className="border border-white/10 bg-white/5 p-4 text-foreground"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.18em]">Taste Finder prefill</p>
                        <p className="mt-2 break-keep font-serif text-lg font-black leading-tight">
                          {initialTasteProfilePreset.label}으로 시작합니다.
                        </p>
                        <p className="mt-2 text-xs font-extrabold leading-5 opacity-75">
                          {initialTasteProfilePreset.cue}
                        </p>
                      </div>
                      <Sparkles size={18} className="shrink-0" />
                    </div>
                    <div className="mt-3 grid grid-cols-3 gap-2 text-center text-[11px] font-black">
                      <span className="border border-white/10 bg-white/5 px-2 py-1">
                        산미 {form.metric1}
                      </span>
                      <span data-testid="taste-profile-prefill-sweetness" className="border border-white/10 bg-white/5 px-2 py-1">
                        단맛 {form.metric2}
                      </span>
                      <span className="border border-white/10 bg-white/5 px-2 py-1">
                        바디 {form.metric3}
                      </span>
                    </div>
                  </div>
                )}

                {/* AI Photo Scan Upload Panel */}
                <div className="bg-white/5 border border-dashed border-primary-amber/30 rounded-2xl p-4 flex flex-col items-center justify-center gap-2">
                  <div className="flex items-center gap-2">
                    <Sparkles size={15} className="text-primary-amber animate-pulse" />
                    <span className="text-xs font-bold text-foreground">AI 원두 패키지 사진 판독 (OCR)</span>
                  </div>
                  <p className="text-[10px] text-muted-foreground text-center leading-relaxed max-w-sm">
                    패키지 뒷면이나 라벨 사진을 올리면 로스터리, 원산지, 프로세싱, 테이스팅 노트를 카드 초안으로 채웁니다. 저장 전 모든 항목을 검토하고 수정할 수 있어요.
                    {profile && (
                      <span className="block mt-0.5 text-primary-amber font-semibold">
                        {getScanAllowanceLabel()}
                      </span>
                    )}
                  </p>
                  <label className="flex items-center gap-1.5 px-3 py-1.5 bg-primary-amber hover:bg-primary-amber/90 text-white rounded-xl text-[11px] font-bold cursor-pointer transition-all shadow-sm mt-1">
                    <ImageIcon size={13} />
                    <span>패키지 사진 촬영 / 업로드</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileScan}
                      className="hidden"
                      disabled={isScanning}
                    />
                  </label>
                  {isScanning && (
                    <div className="flex items-center gap-1.5 text-[10px] text-primary-amber font-semibold animate-pulse mt-1">
                      <Loader2 size={12} className="animate-spin" />
                      <span>Gemini AI가 원두 라벨을 판독 중입니다...</span>
                    </div>
                  )}
                  {scanError && (
                    <div role="alert" className="w-full flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-[11px] leading-relaxed text-red-700">
                      <AlertCircle size={13} className="mt-0.5 shrink-0" />
                      <span>{scanError}</span>
                    </div>
                  )}
                  {scanSuccessMessage && (
                    <div role="status" className="w-full flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-[11px] leading-relaxed text-emerald-700">
                      <CheckCircle size={13} className="mt-0.5 shrink-0" />
                      <span>{scanSuccessMessage}</span>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-muted-foreground">원두 이름</label>
                    <input
                      type="text"
                      placeholder="예: 에티오피아 예가체프"
                      value={form.title}
                      onChange={(e) => updateForm({ title: e.target.value })}
                      className="border border-white/10 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary-amber bg-black/40 text-foreground"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-muted-foreground">로스터리 브랜드</label>
                    <input
                      type="text"
                      placeholder="예: 블루보틀 커피"
                      value={form.subtitle}
                      onChange={(e) => updateForm({ subtitle: e.target.value })}
                      className="border border-white/10 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary-amber bg-black/40 text-foreground"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-muted-foreground">원산지 (Origin)</label>
                    <input
                      type="text"
                      placeholder="예: 에티오피아"
                      value={form.origin}
                      onChange={(e) => updateForm({ origin: e.target.value })}
                      className="border border-white/10 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary-amber bg-black/40 text-foreground"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-muted-foreground">추출 도구 (Method)</label>
                    <select
                      value={form.extraInfo}
                      onChange={(e) => updateForm({ extraInfo: e.target.value })}
                      className="border border-white/10 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary-amber bg-black/40 text-foreground bg-white"
                    >
                      <option value="">도구 선택</option>
                      {COFFEE_METHODS.map((m) => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">원두 이미지 주소 (선택)</label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="https://example.com/image.jpg"
                      value={form.imageUrl || ""}
                      onChange={(e) => updateForm({ imageUrl: e.target.value || null })}
                      className="border border-white/10 rounded-xl pl-9 pr-3 py-2 text-sm w-full focus:outline-none focus:ring-1 focus:ring-primary-amber bg-black/40 text-foreground"
                    />
                    <ImageIcon size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/60" />
                  </div>
                  <p className="text-[10px] text-muted-foreground/60">배경이 깔끔한 사진의 URL을 입력하면 카드에 표시됩니다.</p>
                </div>
              </div>
            )}

            {/* STEP 2: Taste Metrics */}
            {step === 2 && (
              <div className="space-y-6 animate-in slide-in-from-right-5 duration-200">
                <div>
                  <h3 className="font-serif font-bold text-foreground text-base">2단계: 핵심 테이스팅 수치</h3>
                  <p className="text-[11px] text-muted-foreground">원두 고유의 산미, 단맛, 바디감을 1~5점으로 표현해보세요.</p>
                </div>

                <div className="space-y-5">
                  {/* Acidity */}
                  <div className="flex flex-col gap-2 bg-white/5/30 border border-white/10/40 p-3 rounded-2xl">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-foreground">산미 (Acidity)</span>
                      <span data-testid="metric1-value" className="text-xs font-bold text-primary-amber bg-primary-amber/10 px-2 py-0.5 rounded-full">{form.metric1}점</span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="5"
                      step="1"
                      value={form.metric1}
                      onChange={(e) => updateForm({ metric1: parseInt(e.target.value) })}
                      className="w-full accent-primary-amber cursor-pointer h-2 bg-white/10 rounded-lg"
                    />
                    <div className="flex justify-between text-[10px] text-muted-foreground/60">
                      <span>거의 없음 (고소함)</span>
                      <span>화사함 (과일 신맛)</span>
                    </div>
                  </div>

                  {/* Sweetness */}
                  <div className="flex flex-col gap-2 bg-white/5/30 border border-white/10/40 p-3 rounded-2xl">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-foreground">단맛 (Sweetness)</span>
                      <span data-testid="metric2-value" className="text-xs font-bold text-primary-amber bg-primary-amber/10 px-2 py-0.5 rounded-full">{form.metric2}점</span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="5"
                      step="1"
                      value={form.metric2}
                      onChange={(e) => updateForm({ metric2: parseInt(e.target.value) })}
                      className="w-full accent-primary-amber cursor-pointer h-2 bg-white/10 rounded-lg"
                    />
                    <div className="flex justify-between text-[10px] text-muted-foreground/60">
                      <span>드라이함 (쌉싸름)</span>
                      <span>설탕/캐러멜 단맛</span>
                    </div>
                  </div>

                  {/* Body */}
                  <div className="flex flex-col gap-2 bg-white/5/30 border border-white/10/40 p-3 rounded-2xl">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-foreground">바디감 (Body)</span>
                      <span data-testid="metric3-value" className="text-xs font-bold text-primary-amber bg-primary-amber/10 px-2 py-0.5 rounded-full">{form.metric3}점</span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="5"
                      step="1"
                      value={form.metric3}
                      onChange={(e) => updateForm({ metric3: parseInt(e.target.value) })}
                      className="w-full accent-primary-amber cursor-pointer h-2 bg-white/10 rounded-lg"
                    />
                    <div className="flex justify-between text-[10px] text-muted-foreground/60">
                      <span>차처럼 가벼움</span>
                      <span>시럽처럼 묵직함</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 3: Aromatics & Notes */}
            {step === 3 && (
              <div className="space-y-4 max-h-[380px] overflow-y-auto pr-1 animate-in slide-in-from-right-5 duration-200">
                <div>
                  <h3 className="font-serif font-bold text-foreground text-base">3단계: 향미 노트 태그 & 메모</h3>
                  <p className="text-[11px] text-muted-foreground">커피에서 느껴지는 향들을 고르고 감성적인 추가 메모를 남겨주세요.</p>
                </div>

                {/* Preset Chips */}
                <div className="space-y-3">
                  {PRESET_TAGS.map((group) => (
                    <div key={group.category} className="space-y-1.5">
                      <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{group.category}</h4>
                      <div className="flex flex-wrap gap-1.5">
                        {group.items.map((tag) => {
                          const isSelected = form.tags.includes(tag);
                          return (
                            <button
                              key={tag}
                              type="button"
                              onClick={() => isSelected ? removeTag(tag) : addTag(tag)}
                              className={`text-xs px-2.5 py-1 rounded-full border transition-all duration-200 ${
                                isSelected
                                  ? "bg-primary-amber text-white border-primary-amber shadow-sm"
                                  : "bg-white text-muted-foreground border-white/10 hover:bg-white/10/20"
                              }`}
                            >
                              {tag}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Raw Memo input */}
                <div className="flex flex-col gap-1.5 pt-2">
                  <label className="text-xs font-semibold text-muted-foreground">나만의 한 줄 짧은 일기 / 메모</label>
                  <textarea
                    placeholder="예: 입안 가득 감귤 주스 같은 산뜻함이 가득함, 약간 식었을 때 홍차 느낌이 남."
                    value={form.rawNote}
                    onChange={(e) => updateForm({ rawNote: e.target.value })}
                    className="border border-white/10 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary-amber bg-black/40 text-foreground h-16 resize-none"
                  />
                </div>
              </div>
            )}

            {/* STEP 4: Review and Generate AI Note */}
            {step === 4 && (
              <div className="space-y-4 animate-in slide-in-from-right-5 duration-200">
                <h3 className="font-serif font-bold text-foreground text-base">4단계: AI 컵노트 확인 & 발행</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  내가 기록한 커피 데이터와 일기를 바탕으로 AI가 SCA 전문 향미 휠 용어와 매칭하여 감성적인 컵 노트를 요약했습니다. 최종 결과를 확인하고 발행해주세요.
                </p>

                <div className="p-4 bg-white/5/40 border border-white/10 rounded-2xl">
                  <span className="text-[10px] uppercase font-bold text-primary-amber tracking-wider">AI Cup Note Summary</span>
                  <p className="font-serif text-sm italic text-foreground mt-1 leading-relaxed">
                    “{form.aiDescription || "향미 분석이 이루어지지 않았습니다. AI 재생성을 눌러주세요."}”
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleGenerateAiNote}
                  disabled={isGeneratingAiNote}
                  className="flex items-center justify-center gap-2 w-full py-2 bg-white hover:bg-white/10/10 text-primary-amber border border-primary-amber/40 rounded-xl text-xs font-bold transition-all"
                >
                  {isGeneratingAiNote ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      <span>{loadingMessages[loadingMessageIdx]}</span>
                    </>
                  ) : (
                    <>
                      <Sparkles size={14} />
                      <span>{aiNoteError ? "AI 컵노트 다시 시도" : "AI 컵노트 재생성하기"}</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>

          {(aiNoteError || submitError) && (
            <div className="space-y-2 pb-3">
              {aiNoteError && (
                <div role="alert" className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-[11px] leading-relaxed text-red-700">
                  <AlertCircle size={13} className="mt-0.5 shrink-0" />
                  <span>{aiNoteError}</span>
                </div>
              )}
              {submitError && (
                <div role="alert" className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-[11px] leading-relaxed text-red-700">
                  <AlertCircle size={13} className="mt-0.5 shrink-0" />
                  <span>{submitError}</span>
                </div>
              )}
            </div>
          )}

          {/* Stepper Footer actions */}
          <div className="flex justify-between items-center border-t border-white/10 pt-4">
            <div className="flex items-center gap-4">
              <button
                type="button"
                disabled={step === 1 || isGeneratingAiNote}
                onClick={prevStep}
                className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground hover:text-foreground disabled:opacity-40 transition-colors"
              >
                <ArrowLeft size={14} />
                이전
              </button>
              <div className="h-4 w-[1px] bg-white/10" />
              <div className="flex flex-col text-left">
                <span className="text-[9px] text-muted-foreground/60 leading-none">AI 스캔 한도</span>
                <span className="text-xs font-extrabold text-primary-amber leading-tight">
                  {getCompactScanAllowanceLabel()}
                </span>
              </div>
            </div>

            {step < 3 ? (
              <button
                type="button"
                onClick={nextStep}
                disabled={step === 1 && (!form.title || !form.subtitle)}
                className="flex items-center gap-1.5 px-4 py-2 bg-white text-black rounded-xl text-xs font-bold hover:bg-white/90 disabled:opacity-40 transition-all shadow-sm"
              >
                다음
                <ArrowRight size={14} />
              </button>
            ) : step === 3 ? (
              <button
                type="button"
                onClick={handleGenerateAiNote}
                disabled={form.tags.length === 0 || isGeneratingAiNote}
                className="flex items-center gap-1.5 px-5 py-2.5 bg-primary-amber text-white rounded-xl text-xs font-bold hover:bg-primary-amber/80 disabled:opacity-40 transition-all shadow-md"
              >
                {isGeneratingAiNote ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    {loadingMessages[loadingMessageIdx]}
                  </>
                ) : (
                  <>
                    <Sparkles size={14} />
                    {aiNoteError ? "AI 한줄평 다시 시도" : "AI 한줄평 분석 생성"}
                  </>
                )}
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={createCardMutation.isPending}
                className="flex items-center gap-1.5 px-6 py-2.5 bg-primary-amber hover:opacity-90 text-[#0D0A07] rounded-xl text-xs font-bold transition-all shadow-md"
              >
                {createCardMutation.isPending ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    카드 저장 중...
                  </>
                ) : (
                  <>
                    <Coffee size={14} />
                    {submitError ? "카드 저장 다시 시도" : "카드 발행 완료"}
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Right pane: Tasting Card Preview */}
        <div className="flex-1 bg-white/10/20 p-6 md:p-8 flex items-center justify-center relative overflow-hidden">
          <div className="absolute top-4 left-4 z-10 bg-white/75 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-bold text-muted-foreground border border-white/10">
            실시간 카드 프리뷰
          </div>

          {/* Card Preview Instance */}
          <div className="w-full max-w-[320px] animate-pulse-slow">
            <TastingCard
              card={{
                id: "PREVIEW",
                user_id: "preview-user",
                category: form.category,
                title: form.title || "커피 이름을 적어보세요",
                subtitle: form.subtitle || "로스터리를 적어보세요",
                image_url: form.imageUrl,
                badges: [
                  form.category === "coffee" ? "Single Origin" : "Craft Beer",
                  form.extraInfo || "Hario V60",
                ],
                metric1: form.metric1,
                metric2: form.metric2,
                metric3: form.metric3,
                tags: form.tags,
                ai_description: form.aiDescription || "오른쪽에서 AI 맛 분석 생성 버튼을 누르면 이 자리에 감성적인 한줄평이 기입됩니다.",
                footer_meta: {
                  origin: form.origin || "Unknown",
                  date: form.date,
                  extraInfo: form.extraInfo || "Brew Method",
                },
                package_origin: null,
                package_process: null,
                repurchase_intent: "undecided",
                repurchase_reasons: [],
                scan_source: null,
                scan_confidence: null,
                corrected_fields: [],
                confirmed_at: null,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              }}
            />
          </div>
        </div>
      </div>
      <PaymentDialog isOpen={isPaymentOpen} onClose={() => setIsPaymentOpen(false)} />
    </div>
  );
}
