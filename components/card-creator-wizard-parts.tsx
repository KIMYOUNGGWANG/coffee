"use client";

import { ArrowLeft, ArrowRight, Coffee, Loader2, Sparkles } from "lucide-react";
import type { TastingCardFormState } from "@/stores/tastingStore";
import TastingCard from "./TastingCard";
import { buildQuickAddMemoryPayload, type QuickRepurchaseIntent } from "./quick-add-memory-form";

export const PRESET_TAGS = [
  { category: "과일 (Fruit)", items: ["Citrus", "Lemon", "Orange", "Berry", "Cherry", "Apple", "Grape", "Peach"] },
  { category: "달콤 (Sweet)", items: ["Honey", "Caramel", "Chocolate", "Cacao", "Vanilla", "Brown Sugar"] },
  { category: "고소 & 기타 (Nutty & Herbs)", items: ["Almond", "Hazelnut", "Peanut", "Floral", "Jasmine", "Mint", "Herb", "Woody", "Earthy"] },
];

export const COFFEE_METHODS = ["Hario V60", "Kalita Wave", "Espresso", "AeroPress", "French Press", "Moka Pot", "Cold Brew"];
export const ROASTING_POINTS = ["Light", "Medium", "Dark"];
export const QUICK_ADD_INITIAL_REPURCHASE_INTENT: QuickRepurchaseIntent = "again";

export type CardCreatorWizardMode = "quick" | "full";

export type ScannedFormValues = Pick<
  TastingCardFormState,
  "title" | "subtitle" | "origin" | "extraInfo" | "tags" | "metric1" | "metric2" | "metric3" | "metric4" | "metric5" | "metric6"
>;

interface WizardFooterProps {
  wizardMode: CardCreatorWizardMode;
  step: number;
  isGeneratingAiNote: boolean;
  loadingMessage: string;
  aiNoteError: string | null;
  submitError: string | null;
  isSaving: boolean;
  tagCount: number;
  canContinueBasicStep: boolean;
  compactScanAllowanceLabel: string;
  onPrevious: () => void;
  onNext: () => void;
  onGenerateAiNote: () => void;
  onSubmit: () => void;
}

export function WizardFooter({
  wizardMode,
  step,
  isGeneratingAiNote,
  loadingMessage,
  aiNoteError,
  submitError,
  isSaving,
  tagCount,
  canContinueBasicStep,
  compactScanAllowanceLabel,
  onPrevious,
  onNext,
  onGenerateAiNote,
  onSubmit,
}: WizardFooterProps) {
  return (
    <div className="flex justify-between items-center border-t border-white/10 pt-4">
      <div className="flex items-center gap-4">
        <button
          type="button"
          disabled={wizardMode === "quick" || step === 1 || isGeneratingAiNote}
          onClick={onPrevious}
          className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground hover:text-foreground disabled:opacity-40 transition-colors"
        >
          <ArrowLeft size={14} />
          이전
        </button>
        <div className="h-4 w-[1px] bg-white/10" />
        <div className="flex flex-col text-left">
          <span className="text-[9px] text-muted-foreground/60 leading-none">AI 스캔 한도</span>
          <span className="text-xs font-extrabold text-primary-amber leading-tight">
            {compactScanAllowanceLabel}
          </span>
        </div>
      </div>

      {wizardMode === "quick" ? null : step < 3 ? (
        <button
          type="button"
          onClick={onNext}
          disabled={step === 1 && !canContinueBasicStep}
          className="flex items-center gap-1.5 px-4 py-2 bg-white text-black rounded-xl text-xs font-bold hover:bg-white/90 disabled:opacity-40 transition-all shadow-sm"
        >
          다음
          <ArrowRight size={14} />
        </button>
      ) : step === 3 ? (
        <button
          type="button"
          onClick={onGenerateAiNote}
          disabled={tagCount === 0 || isGeneratingAiNote}
          className="flex items-center gap-1.5 px-5 py-2.5 bg-primary-amber text-white rounded-xl text-xs font-bold hover:bg-primary-amber/80 disabled:opacity-40 transition-all shadow-md"
        >
          {isGeneratingAiNote ? (
            <>
              <Loader2 size={14} className="animate-spin" />
              {loadingMessage}
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
          onClick={onSubmit}
          disabled={isSaving}
          className="flex items-center gap-1.5 px-6 py-2.5 bg-primary-amber hover:opacity-90 text-[#0D0A07] rounded-xl text-xs font-bold transition-all shadow-md"
        >
          {isSaving ? (
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
  );
}

interface WizardPreviewProps {
  form: TastingCardFormState;
  wizardMode: CardCreatorWizardMode;
  quickRepurchaseIntent: QuickRepurchaseIntent;
}

export function WizardPreview({ form, wizardMode, quickRepurchaseIntent }: WizardPreviewProps) {
  return (
    <div className="flex-1 bg-white/10/20 p-6 md:p-8 flex items-center justify-center relative overflow-hidden">
      <div className="absolute top-4 left-4 z-10 bg-white/75 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-bold text-muted-foreground border border-white/10">
        실시간 카드 프리뷰
      </div>

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
            metric4: form.metric4,
            metric5: form.metric5,
            metric6: form.metric6,
            tags: form.tags,
            ai_description: form.aiDescription || "오른쪽에서 AI 맛 분석 생성 버튼을 누르면 이 자리에 감성적인 한줄평이 기입됩니다.",
            footer_meta: {
              origin: form.origin || "Unknown",
              date: form.date,
              extraInfo: form.extraInfo || "Brew Method",
            },
            package_origin: null,
            package_process: null,
            purchase_url: form.purchaseUrl.trim() || null,
            purchase_note: form.purchaseNote.trim() || null,
            repurchase_intent: wizardMode === "quick" ? quickRepurchaseIntent : "undecided",
            repurchase_reasons: wizardMode === "quick"
              ? buildQuickAddMemoryPayload({ confirmed: true, form, repurchaseIntent: quickRepurchaseIntent }).repurchaseReasons ?? []
              : [],
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
  );
}
