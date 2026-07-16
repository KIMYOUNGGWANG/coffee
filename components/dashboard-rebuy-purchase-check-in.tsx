"use client";

import { useState, type FormEvent } from "react";
import { PackagePlus } from "lucide-react";
import type { RebuyShelfPurchaseCheckIn, RebuyShelfReplenishSource } from "@/lib/rebuy-shelf-transfer";

type DashboardRebuyPurchaseCheckInProps = {
  readonly autoFocus?: boolean;
  readonly isComplete: boolean;
  readonly isSaving: boolean;
  readonly onSave: (purchaseCheckIn: RebuyShelfPurchaseCheckIn) => void;
  readonly source: RebuyShelfReplenishSource;
};

function normalizedValue(value: string): string | null {
  const normalized = value.trim();
  return normalized.length > 0 ? normalized : null;
}

export function DashboardRebuyPurchaseCheckIn({
  autoFocus = false,
  isComplete,
  isSaving,
  onSave,
  source,
}: DashboardRebuyPurchaseCheckInProps) {
  const [purchaseNote, setPurchaseNote] = useState(source.purchaseNote ?? "");
  const [purchaseUrl, setPurchaseUrl] = useState(source.purchaseUrl ?? "");
  const [roastDate, setRoastDate] = useState("");
  const isDisabled = isSaving || isComplete;
  const buttonLabel = isComplete ? "새 봉투 선반에 저장됨" : isSaving ? "선반에 저장 중" : "새 봉투도 선반에 담기";

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSave({
      purchaseNote: normalizedValue(purchaseNote),
      purchaseUrl: normalizedValue(purchaseUrl),
      roastDate: normalizedValue(roastDate),
    });
  };

  return (
    <form
      className="mt-4 rounded-2xl border border-background-dark/10 bg-[#FFF8EC] p-3 text-background-dark shadow-[inset_0_1px_0_rgba(255,255,255,0.75)]"
      data-testid="rebuy-purchase-check-in"
      onSubmit={handleSubmit}
    >
      <div>
        <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#8F533B]">이번 봉투 단서</p>
        <p className="mt-1 break-keep text-sm font-black">이번에 달라진 구매처·가격과 로스팅일만 고치면 다음에도 최신 단서로 다시 찾아요.</p>
      </div>
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        <label className="grid gap-1 text-xs font-black">
          이번 구매 단서
          <input
            aria-label="이번 구매 단서"
            className="min-h-11 rounded-xl border border-background-dark/50 bg-white px-3 text-sm font-semibold outline-none transition focus:border-primary-amber focus:ring-2 focus:ring-primary-amber/30"
            maxLength={160}
            onChange={(event) => setPurchaseNote(event.target.value)}
            placeholder="예: 합정 쇼룸 200g 21,000원"
            type="text"
            value={purchaseNote}
          />
        </label>
        <label className="grid gap-1 text-xs font-black">
          새 봉투 로스팅일
          <input
            aria-label="새 봉투 로스팅일"
            className="min-h-11 rounded-xl border border-background-dark/50 bg-white px-3 text-sm font-semibold outline-none transition focus:border-primary-amber focus:ring-2 focus:ring-primary-amber/30"
            onChange={(event) => setRoastDate(event.target.value)}
            type="date"
            value={roastDate}
          />
        </label>
      </div>
      <label className="mt-2 grid gap-1 text-xs font-black">
        이번 구매 링크
        <input
          aria-label="이번 구매 링크"
          className="min-h-11 rounded-xl border border-background-dark/50 bg-white px-3 text-sm font-semibold outline-none transition focus:border-primary-amber focus:ring-2 focus:ring-primary-amber/30"
          maxLength={500}
          onChange={(event) => setPurchaseUrl(event.target.value)}
          placeholder="https://"
          type="url"
          value={purchaseUrl}
        />
      </label>
      <button
        autoFocus={autoFocus}
        className="mt-3 inline-flex min-h-11 w-full items-center justify-center gap-1.5 rounded-full bg-background-dark px-4 text-xs font-black text-[#FFF8EC] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
        disabled={isDisabled}
        type="submit"
      >
        <PackagePlus aria-hidden="true" size={14} />
        {buttonLabel}
      </button>
    </form>
  );
}
