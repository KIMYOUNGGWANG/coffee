"use client";

import { Award, BookOpen, Camera, CheckCircle } from "lucide-react";
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
    <div className="bg-gradient-to-br from-espresso to-caramel text-cream border border-caramel/30 rounded-3xl p-5 shadow-lg space-y-4">
      <div className="flex items-center gap-1.5">
        {profile?.is_premium ? <CheckCircle size={16} className="text-cream" /> : <Award size={16} className="text-cream" />}
        <span className="text-[10px] uppercase font-bold tracking-widest text-white bg-cream/15 px-2.5 py-0.5 rounded-full inline-block">
          {profile?.is_premium ? "Premium Member" : "Usage & Upgrade"}
        </span>
      </div>

      <div>
        <h3 className="font-serif font-bold text-base mt-2">사용량과 유료 가치</h3>
        <p className="text-xs text-cream/75 mt-1 leading-relaxed">
          무료 스캔을 먼저 쓰고, 이후에는 충전 크레딧 또는 Premium으로 원두 패키지 분석을 이어갑니다.
        </p>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/10 p-3 space-y-2.5">
        <div className="flex items-center justify-between text-xs">
          <span className="flex items-center gap-1.5 text-cream/85">
            <Camera size={13} />
            무료 AI 스캔 {scansUsed} / {scanLimit}
          </span>
          <span className="font-bold text-white">{remainingScans(profile)}회 남음</span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-white/15">
          <div className="h-full rounded-full bg-cream" style={{ width: `${scanProgress}%` }} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="rounded-2xl border border-white/10 bg-white/10 p-3">
          <p className="text-cream/60">보유 크레딧</p>
          <p className="mt-1 font-bold text-white">보유 크레딧 {profile?.credits ?? 0}개</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/10 p-3">
          <p className="text-cream/60">PDF 기록북</p>
          <p className="mt-1 font-bold text-white">{profile?.has_pdf_access ? "PDF 기록북 보유" : "PDF 기록북 미보유"}</p>
        </div>
      </div>

      <div className="space-y-2 text-xs">
        <div className="flex justify-between border-b border-cream/20 pb-1.5 text-cream/80">
          <span>AI 라벨 스캔 보조</span>
          <span className="font-bold text-white">크레딧/Premium</span>
        </div>
        <div className="flex justify-between border-b border-cream/20 pb-1.5 text-cream/80">
          <span>기록 기반 AI 취향 리캡</span>
          <span className="font-bold text-white">포함</span>
        </div>
        <div className="flex justify-between pb-1.5 text-cream/80">
          <span>공유 카드 내보내기</span>
          <span className="font-bold text-white">포함</span>
        </div>
      </div>

      <Button
        onClick={onOpenPayment}
        className="w-full bg-cream hover:bg-cream/90 text-espresso font-bold py-2.5 rounded-xl text-xs transition-all shadow-md active:scale-98 flex items-center justify-center gap-1.5 cursor-pointer"
      >
        <BookOpen size={13} strokeWidth={2.5} />
        월 $3.99로 구독하기
      </Button>
    </div>
  );
}
