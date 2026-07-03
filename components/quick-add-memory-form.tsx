"use client";

import { AlertCircle, Coffee, Loader2, ShieldCheck } from "lucide-react";
import { useAnalyticsEvents } from "@/hooks/use-analytics-events";
import { useCreateTastingCard } from "@/hooks/useTastingCards";
import type { CreateTastingCardInput } from "@/hooks/useTastingCards";
import type { RepurchaseIntent } from "@/lib/coffee-memory";
import type { TastingCardFormState } from "@/stores/tastingStore";
import { useTastingStore } from "@/stores/tastingStore";
import { getErrorMessage } from "./card-creator-errors";

export type QuickRepurchaseIntent = Exclude<RepurchaseIntent, "undecided">;
export type QuickAddMemoryFields = Readonly<
  Pick<TastingCardFormState, "title" | "subtitle" | "imageUrl" | "metric1" | "metric2" | "metric3" | "metric4" | "metric5" | "metric6" | "rawNote" | "origin" | "date" | "extraInfo" | "purchaseUrl" | "purchaseNote">
> & {
  readonly tags: readonly string[];
};

export type BuildQuickAddMemoryPayloadInput = {
  readonly confirmed: true;
  readonly form: QuickAddMemoryFields;
  readonly repurchaseIntent: QuickRepurchaseIntent;
};

type QuickAddMemoryFormProps = {
  readonly confirmed: true;
  readonly tasteProfileLabel?: string | null;
  readonly onSaved: () => void;
  readonly onRepurchaseIntentChange: (intent: QuickRepurchaseIntent) => void;
  readonly onSubmitError: (message: string | null) => void;
  readonly onValidationErrorChange: (message: string | null) => void;
  readonly repurchaseIntent: QuickRepurchaseIntent;
  readonly validationError: string | null;
};

const QUICK_ADD_EMPTY_BEAN_MESSAGE = "원두 이름을 입력해야 빠른 기록을 저장할 수 있어요.";
const QUICK_ADD_EMPTY_ROASTER_MESSAGE = "로스터리를 입력해야 나중에 다시 찾을 수 있어요.";

const QUICK_REPURCHASE_OPTIONS: readonly { readonly value: QuickRepurchaseIntent; readonly label: string }[] = [
  { value: "again", label: "다시 살래요" },
  { value: "maybe", label: "고민할래요" },
  { value: "no", label: "이번만" },
];
const quickFieldClassName = "border border-[#d7c8b8] rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#c77a48]/24 focus:border-[#c77a48] bg-[#fffaf2] text-[#2f251f] placeholder:text-[#7c6d61] shadow-inner shadow-[#2f251f]/[0.03]";

export function getQuickAddValidationError(input: Pick<QuickAddMemoryFields, "title" | "subtitle">): string | null {
  if (!input.title.trim()) return QUICK_ADD_EMPTY_BEAN_MESSAGE;
  if (!input.subtitle.trim()) return QUICK_ADD_EMPTY_ROASTER_MESSAGE;
  return null;
}

export function buildQuickAddMemoryPayload(input: BuildQuickAddMemoryPayloadInput): CreateTastingCardInput {
  const beanName = input.form.title.trim();
  const roaster = input.form.subtitle.trim();
  const oneLineNote = input.form.rawNote.trim();
  const repurchaseReasons = oneLineNote ? [oneLineNote] : [];

  return {
    category: "coffee",
    title: beanName,
    subtitle: roaster || "홈카페",
    imageUrl: null,
    badges: ["20초 기록"],
    metric1: 3,
    metric2: 3,
    metric3: 3,
    metric4: 3,
    metric5: 3,
    metric6: 3,
    tags: [],
    aiDescription: oneLineNote || `${beanName} 빠른 기록`,
    footerMeta: {
      origin: "Quick Add",
      date: input.form.date,
      ...(oneLineNote ? { extraInfo: oneLineNote } : {}),
    },
    packageOrigin: null,
    packageProcess: null,
    purchaseUrl: null,
    purchaseNote: null,
    repurchaseIntent: input.repurchaseIntent,
    repurchaseReasons,
    scanSource: "manual",
    correctedFields: [],
    confirmed: input.confirmed,
  };
}

export function QuickAddMemoryForm({
  confirmed,
  tasteProfileLabel = null,
  onSaved,
  onRepurchaseIntentChange,
  onSubmitError,
  onValidationErrorChange,
  repurchaseIntent,
  validationError,
}: QuickAddMemoryFormProps) {
  const { form, updateForm, resetForm } = useTastingStore();
  const createCardMutation = useCreateTastingCard();
  const { trackEvent } = useAnalyticsEvents();

  const handleQuickAddSubmit = async () => {
    onValidationErrorChange(null);
    onSubmitError(null);

    const validationMessage = getQuickAddValidationError({ title: form.title, subtitle: form.subtitle });
    if (validationMessage) {
      onValidationErrorChange(validationMessage);
      return;
    }

    try {
      await createCardMutation.mutateAsync(buildQuickAddMemoryPayload({ confirmed, form, repurchaseIntent }));
      trackEvent("card_saved", {
        mode: "quick_add",
        repurchase_intent: repurchaseIntent,
        tag_count: form.tags.length,
      });
      resetForm();
      onSaved();
    } catch (error) {
      onSubmitError(getErrorMessage(error, "빠른 기록 저장에 실패했습니다. 잠시 후 다시 시도해주세요."));
    }
  };

  return (
    <>
      <div className="space-y-4 animate-in slide-in-from-right-5 duration-200">
        <div>
          <h3 className="font-serif text-base font-black text-[#fff8ec]">빠른 기록</h3>
          <p className="text-[11px] font-semibold text-[#d8c8b6]">기억이 사라지기 전에 원두, 로스터리, 다시 살 단서만 먼저 남깁니다.</p>
        </div>

        {tasteProfileLabel && (
          <div
            data-testid="taste-profile-prefill"
            className="rounded-2xl border border-[#c77a48]/32 bg-[#2a1912] p-3 text-[#fff8ec]"
          >
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-primary-amber">취향 기준 불러옴</p>
            <p className="mt-1 break-keep text-sm font-black leading-5">
              {tasteProfileLabel}으로 빠른 기록을 시작합니다.
            </p>
            <div className="mt-2 grid grid-cols-3 gap-2 text-center text-[11px] font-black">
              <span className="border border-[#c77a48]/24 bg-[#fff8ec]/8 px-2 py-1">산미 {form.metric1}</span>
              <span data-testid="taste-profile-prefill-sweetness" className="border border-[#c77a48]/24 bg-[#fff8ec]/8 px-2 py-1">
                단맛 {form.metric2}
              </span>
              <span className="border border-[#c77a48]/24 bg-[#fff8ec]/8 px-2 py-1">바디 {form.metric3}</span>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="quick-bean-name" className="text-xs font-black text-[#fff8ec]">원두 이름</label>
            <input
              id="quick-bean-name"
              type="text"
              placeholder="예: Ethiopia Guji"
              value={form.title}
              onChange={(event) => updateForm({ title: event.target.value })}
              className={quickFieldClassName}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="quick-roaster" className="text-xs font-black text-[#fff8ec]">로스터리</label>
            <input
              id="quick-roaster"
              type="text"
              placeholder="예: Fritz Coffee"
              value={form.subtitle}
              onChange={(event) => updateForm({ subtitle: event.target.value })}
              className={quickFieldClassName}
            />
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="quick-note" className="text-xs font-black text-[#fff8ec]">한 줄 메모</label>
          <textarea
            id="quick-note"
            placeholder="예: 식으니까 복숭아 향이 더 편했다"
            value={form.rawNote}
            onChange={(event) => updateForm({ rawNote: event.target.value })}
            className={`${quickFieldClassName} h-20 resize-none`}
          />
        </div>

        <div className="space-y-2">
          <p className="text-xs font-black text-[#fff8ec]">다시 살까요?</p>
          <div className="grid grid-cols-3 gap-2">
            {QUICK_REPURCHASE_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                aria-pressed={repurchaseIntent === option.value}
                onClick={() => onRepurchaseIntentChange(option.value)}
                className={`min-h-11 rounded-xl border px-2 text-xs font-black transition-colors ${
                  repurchaseIntent === option.value
                    ? "border-[#c77a48] bg-[#c77a48] text-white shadow-sm"
                    : "border-[#fff8ec]/16 bg-[#fff8ec]/10 text-[#eadccd] hover:border-[#c77a48]/45 hover:bg-[#fff8ec]/16"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {validationError && (
          <div role="alert" className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-[11px] leading-relaxed text-red-700">
            <AlertCircle size={13} className="mt-0.5 shrink-0" />
            <span>{validationError}</span>
          </div>
        )}
        <p className="inline-flex items-start gap-2 rounded-2xl border border-[#fff8ec]/12 bg-[#fff8ec]/7 px-3 py-2 text-[11px] font-semibold leading-5 text-[#d8c8b6]">
          <ShieldCheck className="mt-0.5 shrink-0 text-primary-amber" size={13} />
          사진 원본은 저장하지 않아요. 내 서랍에는 확인한 기록과 다시 살 단서만 비공개로 남아요.
        </p>
      </div>

      <button
        type="button"
        onClick={handleQuickAddSubmit}
        disabled={createCardMutation.isPending}
        className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-xl bg-[#c77a48] px-6 py-2.5 text-xs font-black text-white shadow-[0_10px_24px_rgba(199,122,72,0.24)] transition-all hover:bg-[#b86b3d] disabled:opacity-50"
      >
        {createCardMutation.isPending ? (
          <>
            <Loader2 size={14} className="animate-spin" />
            기록 저장 중...
          </>
        ) : (
          <>
            <Coffee size={14} />
            기록 저장
          </>
        )}
      </button>
    </>
  );
}
