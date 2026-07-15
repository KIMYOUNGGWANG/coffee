"use client";

import { Check, ChevronDown, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { GuestDraftCorrections } from "@/lib/guest-draft";

type CoffeeMemoryEditorProps = {
  readonly value: GuestDraftCorrections;
  readonly hasUncertainFacts: boolean;
  readonly confirmed: boolean;
  readonly pending: boolean;
  readonly retrying: boolean;
  readonly onChange: (value: GuestDraftCorrections) => void;
  readonly onConfirmChange: (confirmed: boolean) => void;
  readonly onSave: () => void;
};

const inputClassName = "mt-1.5 min-h-11 w-full rounded-xl border border-[var(--paper-border)] bg-white/55 px-3 py-2 text-sm text-[var(--paper-foreground)] outline-none transition focus:border-[#8C5E35] focus:ring-4 focus:ring-[#C58948]/20";
const tasteAxes = [
  { key: "acidity", label: "산미", low: "부드러움", high: "선명함" },
  { key: "sweetness", label: "단맛", low: "담백함", high: "풍부함" },
  { key: "body", label: "바디감", low: "가벼움", high: "묵직함" },
] as const;
const repurchaseOptions = [
  { intent: "again", label: "또 사고 싶어요" },
  { intent: "maybe", label: "아마 살 것 같아요" },
  { intent: "no", label: "다시 사진 않을래요" },
  { intent: "undecided", label: "아직 모르겠어요" },
] as const satisfies readonly {
  readonly intent: GuestDraftCorrections["repurchase_intent"];
  readonly label: string;
}[];

export function CoffeeMemoryEditor({
  value,
  hasUncertainFacts,
  confirmed,
  pending,
  retrying,
  onChange,
  onConfirmChange,
  onSave,
}: CoffeeMemoryEditorProps) {
  return (
    <section className="hyangmi-paper rounded-3xl border border-[var(--paper-border)] p-5 shadow-sm sm:p-7">
      <header className="border-b border-[var(--paper-border)] pb-5">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#8C5E35]">Rebuy Memory</p>
        <h2 className="mt-2 font-serif text-2xl font-bold">다시 살 단서만 먼저 남겨요</h2>
        <p className="mt-2 text-sm leading-6 text-[var(--paper-muted-foreground)]">
          원두 이름, 로스터리, 다시 살지, 한 줄 메모만 있으면 충분합니다. 자세한 맛 정보는 나중에 덧붙일 수 있어요.
        </p>
        {hasUncertainFacts && (
          <p className="mt-3 inline-flex items-center gap-2 rounded-full bg-[#E5C09B]/45 px-3 py-1.5 text-xs font-semibold text-[#3E3124]">
            <ShieldCheck size={15} aria-hidden="true" />
            확실하지 않음
          </p>
        )}
      </header>

      <fieldset className="mt-6 grid gap-4 sm:grid-cols-2">
        <legend className="mb-3 font-serif text-lg font-bold">20초 비공개 기록</legend>
        <label className="text-sm font-semibold">
          원두 이름
          <input className={inputClassName} value={value.title} maxLength={160} required onChange={(event) => onChange({ ...value, title: event.target.value })} />
        </label>
        <label className="text-sm font-semibold">
          로스터리
          <input className={inputClassName} value={value.subtitle} maxLength={160} required onChange={(event) => onChange({ ...value, subtitle: event.target.value })} />
        </label>
        <div className="sm:col-span-2">
          <p className="text-sm font-semibold">다시 사고 싶은가요?</p>
          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {repurchaseOptions.map((option) => (
            <label className="flex min-h-11 cursor-pointer items-center gap-2 rounded-xl border border-[var(--paper-border)] bg-white/35 px-3 text-xs font-semibold has-[:checked]:border-[#8C5E35] has-[:checked]:bg-[#E5C09B]/40" key={option.intent}>
              <input type="radio" name="repurchase" value={option.intent} checked={value.repurchase_intent === option.intent} onChange={() => onChange({ ...value, repurchase_intent: option.intent })} />
              {option.label}
            </label>
          ))}
          </div>
        </div>
        <label className="text-sm font-semibold sm:col-span-2">
          한 줄 메모
          <textarea className={`${inputClassName} min-h-28 resize-y`} value={value.raw_note} maxLength={2000} onChange={(event) => onChange({ ...value, raw_note: event.target.value })} />
        </label>
      </fieldset>

      <details className="mt-6 rounded-2xl border border-[var(--paper-border)] bg-white/28 p-4">
        <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 text-sm font-bold marker:content-none">
          <span>자세히 추가</span>
          <ChevronDown size={16} aria-hidden="true" />
        </summary>
        <fieldset className="mt-4 grid gap-4 border-t border-[var(--paper-border)] pt-4 sm:grid-cols-2">
          <legend className="sr-only">패키지와 맛 자세히 추가</legend>
          <label className="text-sm font-semibold">
            원산지
            <input className={inputClassName} value={value.package_origin ?? ""} maxLength={160} onChange={(event) => onChange({ ...value, package_origin: event.target.value || null })} />
          </label>
          <label className="text-sm font-semibold">
            가공 방식
            <input className={inputClassName} value={value.package_process ?? ""} maxLength={160} onChange={(event) => onChange({ ...value, package_process: event.target.value || null })} />
          </label>
          <label className="text-sm font-semibold sm:col-span-2">
            향미 태그 (쉼표로 구분)
            <input className={inputClassName} value={value.tags.join(", ")} maxLength={320} onChange={(event) => onChange({ ...value, tags: event.target.value.split(",").map((tag) => tag.trim()).filter(Boolean).slice(0, 12) })} />
          </label>
          {tasteAxes.map((axis) => (
            <label className="block text-sm font-semibold" key={axis.key}>
              <span className="flex items-center justify-between"><span>{axis.label}</span><output>{value[axis.key]} / 5</output></span>
              <input
                className="mt-3 w-full accent-[#8C5E35]"
                type="range"
                min="1"
                max="5"
                step="1"
                aria-label={axis.label}
                value={value[axis.key]}
                onChange={(event) => onChange({ ...value, [axis.key]: Number(event.target.value) })}
              />
              <span className="flex justify-between text-xs font-normal text-[var(--paper-muted-foreground)]"><span>{axis.low}</span><span>{axis.high}</span></span>
            </label>
          ))}
          <label className="text-sm font-semibold sm:col-span-2">
            다시 찾을 이유
            <input className={inputClassName} value={value.repurchase_reasons.join(", ")} maxLength={400} placeholder="예: 데일리 커피, 선물하기 좋음" onChange={(event) => onChange({ ...value, repurchase_reasons: event.target.value.split(",").map((reason) => reason.trim()).filter(Boolean).slice(0, 8) })} />
          </label>
        </fieldset>
      </details>

      <div className="mt-7 rounded-2xl border border-[var(--paper-border)] bg-white/40 p-4">
        <label className="flex min-h-11 cursor-pointer items-center gap-3 text-sm font-bold">
          <input className="size-5 accent-[#8C5E35]" type="checkbox" checked={confirmed} onChange={(event) => onConfirmChange(event.target.checked)} />
          이 내용으로 기록할게요
        </label>
        <p className="mt-1 pl-8 text-xs leading-5 text-[var(--paper-muted-foreground)]">사진 원본은 저장하지 않아요. 저장할 때만 로그인하고, 내 Rebuy List를 위한 비공개 기록으로 저장돼요.</p>
        <Button className="mt-4 min-h-12 w-full rounded-xl bg-[#8C5E35] text-[#F7F7F4] hover:bg-[#6f4828]" disabled={!confirmed || pending || !value.title.trim() || !value.subtitle.trim() || !value.raw_note.trim()} onClick={onSave}>
          <Check size={17} aria-hidden="true" />
          {pending ? "저장 중..." : retrying ? "저장 다시 시도" : "내 CoffeeDex에 저장"}
        </Button>
      </div>
    </section>
  );
}
