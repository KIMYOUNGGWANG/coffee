"use client";

import { Camera } from "lucide-react";

type DashboardScanActionProps = {
  readonly onScan: () => void;
};

export function DashboardScanAction({ onScan }: DashboardScanActionProps) {
  return (
    <button
      type="button"
      onClick={onScan}
      aria-label="새 원두 스캔"
      className="fixed bottom-[calc(5.55rem+env(safe-area-inset-bottom))] left-1/2 z-50 grid size-[4.35rem] -translate-x-1/2 place-items-center rounded-full border border-[#f2c47c] bg-primary-amber text-background-dark shadow-[0_18px_42px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.38)] transition-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground active:scale-95 md:hidden"
    >
      <span className="flex flex-col items-center gap-0.5 text-[11px] font-black">
        <Camera aria-hidden="true" size={26} strokeWidth={2.2} />
        스캔
      </span>
    </button>
  );
}
