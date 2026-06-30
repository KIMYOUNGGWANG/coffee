"use client";

import { AlertCircle, Coffee, Loader2 } from "lucide-react";
import { useAnalyticsEvents } from "@/hooks/use-analytics-events";
import { useCreateTastingCard } from "@/hooks/useTastingCards";
import type { CreateTastingCardInput } from "@/hooks/useTastingCards";
import type { RepurchaseIntent } from "@/lib/coffee-memory";
import type { TastingCardFormState } from "@/stores/tastingStore";
import { useTastingStore } from "@/stores/tastingStore";
import { getErrorMessage } from "./card-creator-errors";

export type QuickRepurchaseIntent = Exclude<RepurchaseIntent, "undecided">;
export type QuickFlavorChip = (typeof QUICK_FLAVOR_CHIPS)[number];

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

const QUICK_FLAVOR_CHIPS = ["복숭아", "초콜릿", "꿀", "시트러스", "고소함", "꽃향"] as const;
const QUICK_ADD_EMPTY_BEAN_MESSAGE = "원두 이름을 입력해야 빠른 기록을 저장할 수 있어요.";

const QUICK_REPURCHASE_OPTIONS: readonly { readonly value: QuickRepurchaseIntent; readonly label: string }[] = [
  { value: "again", label: "다시 살래요" },
  { value: "maybe", label: "고민할래요" },
  { value: "no", label: "이번만" },
];

export function getQuickAddValidationError(input: Pick<QuickAddMemoryFields, "title">): string | null {
  return input.title.trim() ? null : QUICK_ADD_EMPTY_BEAN_MESSAGE;
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
    imageUrl: input.form.imageUrl,
    badges: ["Quick Add", input.form.extraInfo || "Memory"],
    metric1: input.form.metric1,
    metric2: input.form.metric2,
    metric3: input.form.metric3,
    metric4: input.form.metric4,
    metric5: input.form.metric5,
    metric6: input.form.metric6,
    tags: input.form.tags,
    aiDescription: oneLineNote || `${beanName} 빠른 기록`,
    footerMeta: {
      origin: input.form.origin || "Unknown",
      date: input.form.date,
      ...(oneLineNote ? { extraInfo: oneLineNote } : {}),
    },
    packageOrigin: input.form.origin || null,
    packageProcess: input.form.extraInfo || null,
    purchaseUrl: input.form.purchaseUrl.trim() || null,
    purchaseNote: input.form.purchaseNote.trim() || null,
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
  const { form, updateForm, resetForm, addTag, removeTag } = useTastingStore();
  const createCardMutation = useCreateTastingCard();
  const { trackEvent } = useAnalyticsEvents();

  const handleQuickAddSubmit = async () => {
    onValidationErrorChange(null);
    onSubmitError(null);

    const validationMessage = getQuickAddValidationError({ title: form.title });
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
          <h3 className="font-serif font-bold text-foreground text-base">빠른 기록</h3>
          <p className="text-[11px] text-muted-foreground">오늘 마신 커피를 한 화면에서 바로 저장합니다.</p>
        </div>

        {tasteProfileLabel && (
          <div
            data-testid="taste-profile-prefill"
            className="rounded-2xl border border-primary-amber/20 bg-primary-amber/10 p-3 text-foreground"
          >
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-primary-amber">Taste Finder prefill</p>
            <p className="mt-1 break-keep text-sm font-black leading-5">
              {tasteProfileLabel}으로 빠른 기록을 시작합니다.
            </p>
            <div className="mt-2 grid grid-cols-3 gap-2 text-center text-[11px] font-black">
              <span className="border border-white/10 bg-white/5 px-2 py-1">산미 {form.metric1}</span>
              <span data-testid="taste-profile-prefill-sweetness" className="border border-white/10 bg-white/5 px-2 py-1">
                단맛 {form.metric2}
              </span>
              <span className="border border-white/10 bg-white/5 px-2 py-1">바디 {form.metric3}</span>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="quick-bean-name" className="text-xs font-semibold text-muted-foreground">원두 이름</label>
            <input
              id="quick-bean-name"
              type="text"
              placeholder="예: Ethiopia Guji"
              value={form.title}
              onChange={(event) => updateForm({ title: event.target.value })}
              className="border border-white/10 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary-amber bg-black/40 text-foreground"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="quick-roaster" className="text-xs font-semibold text-muted-foreground">로스터</label>
            <input
              id="quick-roaster"
              type="text"
              placeholder="예: Fritz Coffee"
              value={form.subtitle}
              onChange={(event) => updateForm({ subtitle: event.target.value })}
              className="border border-white/10 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary-amber bg-black/40 text-foreground"
            />
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="quick-note" className="text-xs font-semibold text-muted-foreground">한 줄 메모</label>
          <textarea
            id="quick-note"
            placeholder="오늘의 기억을 한 줄로 남겨보세요"
            value={form.rawNote}
            onChange={(event) => updateForm({ rawNote: event.target.value })}
            className="border border-white/10 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary-amber bg-black/40 text-foreground h-20 resize-none"
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="quick-purchase-url" className="text-xs font-semibold text-muted-foreground">다시 찾을 링크</label>
            <input
              id="quick-purchase-url"
              type="url"
              placeholder="https://roaster.example/coffee"
              value={form.purchaseUrl}
              onChange={(event) => updateForm({ purchaseUrl: event.target.value })}
              className="border border-white/10 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary-amber bg-black/40 text-foreground"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="quick-purchase-note" className="text-xs font-semibold text-muted-foreground">구매 단서</label>
            <input
              id="quick-purchase-note"
              type="text"
              placeholder="예: 공식몰 200g 옵션"
              value={form.purchaseNote}
              onChange={(event) => updateForm({ purchaseNote: event.target.value })}
              className="border border-white/10 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary-amber bg-black/40 text-foreground"
            />
          </div>
        </div>

        <div className="space-y-2 rounded-2xl border border-white/10 bg-white/5 p-3">
          <p className="text-xs font-bold text-foreground">한국어 향미 단어</p>
          <div className="flex flex-wrap gap-1.5">
            {QUICK_FLAVOR_CHIPS.map((tag) => {
              const isSelected = form.tags.includes(tag);
              return (
                <button
                  key={tag}
                  type="button"
                  onClick={() => isSelected ? removeTag(tag) : addTag(tag)}
                  className={`rounded-full border px-3 py-1.5 text-xs font-bold transition-colors ${
                    isSelected
                      ? "border-primary-amber bg-primary-amber text-background-dark"
                      : "border-white/10 bg-black/30 text-muted-foreground hover:bg-white/10 hover:text-foreground"
                  }`}
                >
                  {tag}
                </button>
              );
            })}
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-xs font-semibold text-muted-foreground">다시 살까요?</p>
          <div className="grid grid-cols-3 gap-2">
            {QUICK_REPURCHASE_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                aria-pressed={repurchaseIntent === option.value}
                onClick={() => onRepurchaseIntentChange(option.value)}
                className={`min-h-11 rounded-xl border px-2 text-xs font-black transition-colors ${
                  repurchaseIntent === option.value
                    ? "border-primary-amber bg-primary-amber text-background-dark"
                    : "border-white/10 bg-black/30 text-muted-foreground hover:bg-white/10 hover:text-foreground"
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
      </div>

      <button
        type="button"
        onClick={handleQuickAddSubmit}
        disabled={createCardMutation.isPending}
        className="flex items-center gap-1.5 px-6 py-2.5 bg-primary-amber hover:opacity-90 text-[#0D0A07] rounded-xl text-xs font-bold transition-all shadow-md disabled:opacity-50"
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
