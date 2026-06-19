"use client";

import { BookOpen, Camera, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { UserProfileData } from "@/hooks/useTastingCards";

type DashboardUsagePanelProps = {
  readonly profile: UserProfileData | undefined;
  readonly onOpenPayment: () => void;
};

function remainingScans(profile: UserProfileData | undefined): number {
  if (!profile) {
    return 0;
  }
  return Math.max(0, profile.monthly_scan_limit - profile.scans_used);
}

export default function DashboardUsagePanel({ profile, onOpenPayment }: DashboardUsagePanelProps) {
  const scansUsed = profile?.scans_used ?? 0;
  const scanLimit = profile?.monthly_scan_limit ?? 5;
  const scanProgress = scanLimit > 0 ? Math.min(100, Math.round((scansUsed / scanLimit) * 100)) : 0;

  return (
    <div className="space-y-4 rounded-3xl border border-white/10 bg-white/5 p-5 text-foreground shadow-sm">
      <div className="flex items-center gap-1.5">
        <CheckCircle size={16} className="text-primary-amber" />
        <span className="inline-block rounded-full bg-white/5 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
          {profile?.is_premium ? "Premium Member" : "설정 · 사용량"}
        </span>
      </div>

      <div>
        <h3 className="mt-2 font-serif text-base font-bold">사용량</h3>
        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
          커피 기록과 다시 찾기는 무료입니다. 라벨 스캔 보조와 PDF 기록북은 필요할 때 추가할 수 있습니다.
        </p>
      </div>

      <div className="space-y-2.5 rounded-2xl border border-white/10 bg-black/20 p-3">
        <div className="flex items-center justify-between text-xs">
          <span className="flex items-center gap-1.5 text-muted-foreground">
            <Camera size={13} />
            무료 AI 스캔 {scansUsed} / {scanLimit}
          </span>
          <span className="font-bold text-foreground">{remainingScans(profile)}회 남음</span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-white/15">
          <div className="h-full rounded-full bg-primary-amber" style={{ width: `${scanProgress}%` }} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
          <p className="text-muted-foreground">보유 크레딧</p>
          <p className="mt-1 font-bold text-foreground">보유 크레딧 {profile?.credits ?? 0}개</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
          <p className="text-muted-foreground">PDF 기록북</p>
          <p className="mt-1 font-bold text-foreground">{profile?.has_pdf_access ? "PDF 기록북 보유" : "PDF 기록북 미보유"}</p>
        </div>
      </div>

      <div className="space-y-2 text-xs">
        <div className="flex justify-between border-b border-white/10 pb-1.5 text-muted-foreground">
          <span>AI 라벨 스캔 보조</span>
          <span className="font-bold text-foreground">크레딧/Premium</span>
        </div>
        <div className="flex justify-between border-b border-white/10 pb-1.5 text-muted-foreground">
          <span>기록 기반 AI 취향 리캡</span>
          <span className="font-bold text-foreground">포함</span>
        </div>
        <div className="flex justify-between pb-1.5 text-muted-foreground">
          <span>공유 카드 내보내기</span>
          <span className="font-bold text-foreground">포함</span>
        </div>
      </div>

      <Button
        onClick={onOpenPayment}
        variant="outline"
        className="flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-xl border-white/10 bg-transparent py-2.5 text-xs font-bold text-muted-foreground transition-colors hover:bg-white/5 hover:text-foreground"
      >
        <BookOpen size={13} strokeWidth={2.5} />
        추가 기능 및 결제 보기
      </Button>
    </div>
  );
}
